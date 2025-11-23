module eventum::eventum {
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::package;
    use sui::display;
    use std::string::{Self, String};
    use std::vector;
    use sui::kiosk::{Self, Kiosk, KioskOwnerCap};
    use sui::transfer_policy::{Self, TransferPolicy, TransferPolicyCap}; 
    use sui::table::{Self, Table};
    use eventum::custom_royalty_rule;

    // --- CONSTANTES D'ERREUR ---
    const EWrongAmount: u64 = 0;
    const EAlreadyScanned: u64 = 1;
    const ENotOrganizer: u64 = 2;
    const EAlreadyHasTicket: u64 = 3;
    const EInvalidDistribution: u64 = 4;
    const EPrizesAlreadyDistributed: u64 = 5;
    const EWinnerCountMismatch: u64 = 6;
    const ECheckinNotEnabled: u64 = 7;
    const EWrongEvent: u64 = 8;
    const EEventNotEnded: u64 = 9;
    const ENotCheckedIn: u64 = 10;
    const EAlreadyCertified: u64 = 11;
    const ESoldOut: u64 = 12;
    const EInvalidPercentage: u64 = 13;
    const ENotWhitelisted: u64 = 14;
    const EPrizesNotDistributed: u64 = 15;
    const EInsufficientFunds: u64 = 16;
    const EEventAlreadyEnded: u64 = 17;
    const EHasPrizeDistribution: u64 = 18;

    public struct EVENTUM has drop {}

    public struct OrganizerCap has key, store {
        id: UID,
        event_id: ID,
    }

    public struct Event has key, store {
        id: UID,
        title: String,
        description: String,
        date: String,
        organizer: address,
        price: u64,
        max_supply: u64,
        minted_count: u64,
        royalty_percentage: u16,
        balance: sui::coin::Coin<SUI>,
        minted_list: Table<address, bool>,
        prize_distribution: vector<u64>,
        prizes_distributed: bool,
        checkin_enabled: bool,
        event_ended: bool,
        winner_ranks: Table<ID, u64>,
        pending_prizes: Table<ID, u64>,
        is_competition: bool,
        checkin_whitelist: Table<ID, bool>,
        transfer_policy_id: ID,
        transfer_policy_cap_id: ID,
        asset_urls: vector<String>,
    }

    public struct Ticket has key, store {
        id: UID,
        event_id: ID,
        title: String,
        description: String,
        status: u8, 
        rank: u64, 
        url: String 
    }

    fun init(otw: EVENTUM, ctx: &mut TxContext) {
        let publisher = package::claim(otw, ctx);
        
        let keys = vector[
            string::utf8(b"name"),
            string::utf8(b"description"),
            string::utf8(b"image_url"),
        ];

        let values = vector[
            string::utf8(b"{title}"),
            string::utf8(b"{description}"),
            string::utf8(b"{url}"),
        ];

        let mut display = display::new_with_fields<Ticket>(
            &publisher, keys, values, ctx
        );

        display::update_version(&mut display);
        
        
        transfer::public_transfer(publisher, tx_context::sender(ctx));
        transfer::public_transfer(display, tx_context::sender(ctx));
    }

    // --- CREATION EVENT ---
    public entry fun create_event(
        publisher: &package::Publisher, 
        title: vector<u8>,
        description: vector<u8>,
        date: vector<u8>,
        price: u64,
        max_supply: u64,
        royalty_percentage: u16,
        prize_distribution: vector<u64>,
        is_competition: bool,
        asset_urls_bytes: vector<vector<u8>>, 
        ctx: &mut TxContext
    ) {
        let mut i = 0;
        let len = vector::length(&prize_distribution);
        let mut total_percent = 0;
        while (i < len) {
            total_percent = total_percent + *vector::borrow(&prize_distribution, i);
            i = i + 1;
        };
        assert!(total_percent <= 100, EInvalidDistribution);
        assert!(royalty_percentage <= 100, EInvalidPercentage);

        // 1. Création Policy
        let (mut policy, policy_cap) = transfer_policy::new<Ticket>(publisher, ctx);

        if (price > 0 && royalty_percentage > 0) {
            custom_royalty_rule::add(
                &mut policy,
                &policy_cap,
                royalty_percentage * 100,
                0
            );
        };

        let policy_id = object::id(&policy);
        let cap_id = object::id(&policy_cap);

        transfer::public_share_object(policy);
        transfer::public_transfer(policy_cap, tx_context::sender(ctx));

        // 2. Conversion des URLs (vector<u8> -> String)
        let mut string_urls = vector::empty<String>();
        let url_len = vector::length(&asset_urls_bytes);
        let mut j = 0;
        while (j < url_len) {
            let url_bytes = *vector::borrow(&asset_urls_bytes, j);
            vector::push_back(&mut string_urls, string::utf8(url_bytes));
            j = j + 1;
        };

        // 3. Création de l'Event
        let event_uid = object::new(ctx);
        let event_id = object::uid_to_inner(&event_uid);

        let event = Event {
            id: event_uid,
            title: string::utf8(title),
            description: string::utf8(description),
            date: string::utf8(date),
            organizer: tx_context::sender(ctx),
            price: price,
            max_supply: max_supply,
            minted_count: 0,
            royalty_percentage: royalty_percentage,
            balance: coin::zero(ctx),
            minted_list: table::new(ctx),
            prize_distribution: prize_distribution,
            prizes_distributed: false,
            checkin_enabled: false,
            event_ended: false,
            winner_ranks: table::new(ctx),
            pending_prizes: table::new(ctx),
            is_competition: is_competition,
            checkin_whitelist: table::new(ctx),
            transfer_policy_id: policy_id,
            transfer_policy_cap_id: cap_id,
            asset_urls: string_urls
        };

        let cap = OrganizerCap {
            id: object::new(ctx),
            event_id: event_id
        };

        transfer::share_object(event);
        transfer::public_transfer(cap, tx_context::sender(ctx));
    }

    public entry fun add_to_whitelist(
        cap: &OrganizerCap,
        event: &mut Event,
        ticket_ids: vector<ID>,
        _ctx: &mut TxContext
    ) {
        assert!(object::id(event) == cap.event_id, ENotOrganizer);

        let len = vector::length(&ticket_ids);
        let mut i = 0;
        
        while (i < len) {
            let ticket_id = *vector::borrow(&ticket_ids, i);
            // On autorise ce ticket à faire son check-in
            if (!table::contains(&event.checkin_whitelist, ticket_id)) {
                table::add(&mut event.checkin_whitelist, ticket_id, true);
            };
            i = i + 1;
        }
    }

    public entry fun buy_ticket_into_kiosk(
        event: &mut Event,
        kiosk: &mut Kiosk,
        kiosk_cap: &KioskOwnerCap,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        let buyer = tx_context::sender(ctx);
        assert!(!table::contains(&event.minted_list, buyer), EAlreadyHasTicket);
        assert!(event.minted_count < event.max_supply, ESoldOut);
        
        table::add(&mut event.minted_list, buyer, true);
        event.minted_count = event.minted_count + 1;

        if (event.price == 0) {
            transfer::public_transfer(payment, buyer);
        } else {
            assert!(coin::value(&payment) >= event.price, EWrongAmount);
            coin::join(&mut event.balance, payment);
        };

        let ticket_uid = object::new(ctx);
        
        let ticket = Ticket {
            id: ticket_uid,
            event_id: object::id(event),
            title: event.title,
            description: string::utf8(b"Ticket Kiosk - Non Verifie"),
            status: 0,
            rank: 0,
            url: string::utf8(b"https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=KioskTicket"),
        };

        kiosk::place(kiosk, kiosk_cap, ticket);
    }

    public entry fun self_checkin(
        event: &Event,
        kiosk: &mut Kiosk,
        kiosk_cap: &KioskOwnerCap,
        ticket_id: ID,
        _ctx: &mut TxContext
    ) {
        assert!(event.checkin_enabled, ECheckinNotEnabled);
        assert!(table::contains(&event.checkin_whitelist, ticket_id), ENotWhitelisted);
        let ticket_mut = kiosk::borrow_mut<Ticket>(kiosk, kiosk_cap, ticket_id);
        assert!(ticket_mut.event_id == object::id(event), EWrongEvent);
        assert!(ticket_mut.status == 0, EAlreadyScanned);
        
        ticket_mut.status = 1;
        ticket_mut.description = string::utf8(b"Participant Verified");
        ticket_mut.url = string::utf8(b"https://img.icons8.com/fluency/96/checked-user-male.png");
    }

    public entry fun toggle_checkin(
        cap: &OrganizerCap,
        event: &mut Event,
        enabled: bool,
        _ctx: &mut TxContext
    ) {
        assert!(object::id(event) == cap.event_id, ENotOrganizer);
        event.checkin_enabled = enabled;
    }

    public entry fun distribute_prizes(
        cap: &OrganizerCap,
        event: &mut Event,
        winner_ticket_ids: vector<ID>,
        _ctx: &mut TxContext
    ) {
        assert!(object::id(event) == cap.event_id, ENotOrganizer);
        assert!(!event.prizes_distributed, EPrizesAlreadyDistributed);
        
        let dist_len = vector::length(&event.prize_distribution);
        assert!(dist_len > 0, EInvalidDistribution);
        assert!(vector::length(&winner_ticket_ids) == dist_len, EWinnerCountMismatch);

        let total_pool = coin::value(&event.balance);
        assert!(total_pool > 0, EInsufficientFunds);
        
        let mut i = 0;
        while (i < dist_len) {
            let ticket_id = *vector::borrow(&winner_ticket_ids, i);
            let percent = *vector::borrow(&event.prize_distribution, i);
            
            let prize_amount = (total_pool * percent) / 100;

            if (prize_amount > 0) {
                if (table::contains(&event.pending_prizes, ticket_id)) {
                    let current = table::remove(&mut event.pending_prizes, ticket_id);
                    table::add(&mut event.pending_prizes, ticket_id, current + prize_amount);
                } else {
                    table::add(&mut event.pending_prizes, ticket_id, prize_amount);
                };
            };
            
            let rank = i + 1;
            if (!table::contains(&event.winner_ranks, ticket_id)) {
                table::add(&mut event.winner_ranks, ticket_id, rank);
            };

            i = i + 1;
        };

        event.prizes_distributed = true;
        event.event_ended = true;
    }

    public entry fun set_final_rankings(
        cap: &OrganizerCap,
        event: &mut Event,
        ranked_ticket_ids: vector<ID>,
        _ctx: &mut TxContext
    ) {
        assert!(object::id(event) == cap.event_id, ENotOrganizer);
        assert!(!event.event_ended, EEventAlreadyEnded);
        
        let len = vector::length(&ranked_ticket_ids);
        let mut i = 0;
        
        while (i < len) {
            let ticket_id = *vector::borrow(&ranked_ticket_ids, i);
            let rank = i + 1;
            if (!table::contains(&event.winner_ranks, ticket_id)) {
                table::add(&mut event.winner_ranks, ticket_id, rank);
            };
            i = i + 1;
        };
    }

    public entry fun end_event_without_prizes(
        cap: &OrganizerCap,
        event: &mut Event,
        _ctx: &mut TxContext
    ) {
        assert!(object::id(event) == cap.event_id, ENotOrganizer);
        assert!(vector::length(&event.prize_distribution) == 0, EHasPrizeDistribution);
        assert!(!event.event_ended, EEventAlreadyEnded);
        
        event.event_ended = true;
    }

    public entry fun claim_certification(
        event: &mut Event, 
        kiosk: &mut Kiosk,
        kiosk_cap: &KioskOwnerCap,
        ticket_id: ID,
        ctx: &mut TxContext
    ) {
        assert!(event.event_ended, EEventNotEnded);
        
        let ticket_mut = kiosk::borrow_mut<Ticket>(kiosk, kiosk_cap, ticket_id);
        
        assert!(ticket_mut.event_id == object::id(event), EWrongEvent);
        assert!(ticket_mut.status >= 1, ENotCheckedIn);
        assert!(ticket_mut.status == 1, EAlreadyCertified);

        let url_badge = *vector::borrow(&event.asset_urls, 1);
        let url_gold = *vector::borrow(&event.asset_urls, 2);
        let url_silver = *vector::borrow(&event.asset_urls, 3);
        let url_bronze = *vector::borrow(&event.asset_urls, 4);

        ticket_mut.status = 2; 
        
        if (event.is_competition && table::contains(&event.winner_ranks, ticket_id)) {
            let rank = *table::borrow(&event.winner_ranks, ticket_id);
            ticket_mut.rank = rank;
            
            if (rank == 1) {
                ticket_mut.description = string::utf8(b"Rank #1 - Gold Medal");
                ticket_mut.url = url_gold;
            } else if (rank == 2) {
                ticket_mut.description = string::utf8(b"Rank #2 - Silver Medal");
                ticket_mut.url = url_silver;
            } else if (rank == 3) {
                ticket_mut.description = string::utf8(b"Rank #3 - Bronze Medal");
                ticket_mut.url = url_bronze;
            } else {
                ticket_mut.description = string::utf8(b"Finisher - Ranked");
                ticket_mut.url = url_badge;
            };
        } else {
            ticket_mut.rank = 0;
            ticket_mut.description = string::utf8(b"Participation Certified");
            ticket_mut.url = url_badge;
        };

        if (table::contains(&event.pending_prizes, ticket_id)) {
            let amount = table::remove(&mut event.pending_prizes, ticket_id);
            
            if (amount > 0) {
                let prize_coin = coin::split(&mut event.balance, amount, ctx);
                transfer::public_transfer(prize_coin, tx_context::sender(ctx));
            }
        };
    }

    public entry fun deposit_prize_pool(
        event: &mut Event, // Pas de OrganizerCap ici
        payment: Coin<SUI>,
        _ctx: &mut TxContext
    ) {
        // Pas de check d'OrganizerCap
        
        // On empêche juste de déposer si l'event est déjà fini/distribué pour éviter les erreurs
        assert!(!event.prizes_distributed, EPrizesAlreadyDistributed);
        
        coin::join(&mut event.balance, payment);
    }

    public entry fun withdraw_funds(
        cap: &OrganizerCap,
        event: &mut Event,
        ctx: &mut TxContext
    ) {
        assert!(object::id(event) == cap.event_id, ENotOrganizer);
        assert!(event.prizes_distributed || vector::length(&event.prize_distribution) == 0,
            EPrizesNotDistributed
        );
        
        let amount = coin::value(&event.balance);
        if (amount > 0) {
            let profit = coin::split(&mut event.balance, amount, ctx);
            transfer::public_transfer(profit, tx_context::sender(ctx));
        };
    }
}

module eventum::custom_royalty_rule {
    use sui::transfer_policy::{Self, TransferPolicy, TransferPolicyCap};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    
    public struct Rule has drop {}

    public struct Config has store, drop {
        amount_bp: u16,
        min_amount: u64,
    }

    public fun add<T>(
        policy: &mut TransferPolicy<T>,
        cap: &TransferPolicyCap<T>,
        amount_bp: u16,
        min_amount: u64
    ) {
        transfer_policy::add_rule(
            Rule {}, 
            policy, 
            cap, 
            Config { amount_bp, min_amount }
        );
    }

    public fun pay<T>(
        policy: &mut TransferPolicy<T>,
        request: &mut sui::transfer_policy::TransferRequest<T>,
        payment: Coin<SUI>,
        _ctx: &mut TxContext
    ) {
        let paid = coin::value(&payment);
        let config: &Config = transfer_policy::get_rule(Rule {}, policy);
        
        let expected = (((transfer_policy::paid(request) as u128) * (config.amount_bp as u128) / 10_000) as u64);
        
        assert!(paid >= expected, 0);
        assert!(paid >= config.min_amount, 1);

        transfer_policy::add_to_balance(Rule {}, policy, payment);
        transfer_policy::add_receipt(Rule {}, request);
    }
}
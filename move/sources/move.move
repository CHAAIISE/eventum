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

    public struct EVENTUM has drop {}

    public struct OrganizerCap has key, store {
        id: UID,
        event_id: ID,
    }

    public struct Event has key, store {
        id: UID,
        title: String,
        organizer: address,
        price: u64,
        balance: sui::coin::Coin<SUI>,
        minted_list: Table<address, bool>,
        prize_distribution: vector<u64>, 
        prizes_distributed: bool,
        checkin_enabled: bool,
        event_ended: bool,
        winner_ranks: Table<address, u64>,  // Stocke address → rang (1, 2, 3...)
        is_soulbound: bool,  // Si true, les NFTs deviennent non-transférables après certification
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
        
        let (policy, policy_cap) = transfer_policy::new<Ticket>(&publisher, ctx);

        // Share policy d'abord
        transfer::public_share_object(policy);
        
        // Puis transfer les objets possédés
        transfer::public_transfer(publisher, tx_context::sender(ctx));
        transfer::public_transfer(display, tx_context::sender(ctx));
        transfer::public_transfer(policy_cap, tx_context::sender(ctx));
    }

    // --- CREATION AVEC REGLES DE DISTRIBUTION ---
    public entry fun create_event(
        title: vector<u8>,
        price: u64,
        prize_distribution: vector<u64>,
        is_soulbound: bool,  // Toggle pour rendre les NFTs non-transférables après certification
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

        let event_uid = object::new(ctx);
        let event_id = object::uid_to_inner(&event_uid);

        let event = Event {
            id: event_uid,
            title: string::utf8(title),
            organizer: tx_context::sender(ctx),
            price: price,
            balance: coin::zero(ctx),
            minted_list: table::new(ctx),
            // Stockage des règles
            prize_distribution: prize_distribution,
            prizes_distributed: false,
            checkin_enabled: false,
            event_ended: false,
            winner_ranks: table::new(ctx),
            is_soulbound: is_soulbound
        };

        let cap = OrganizerCap {
            id: object::new(ctx),
            event_id: event_id
        };

        transfer::share_object(event);
        transfer::public_transfer(cap, tx_context::sender(ctx));
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
        table::add(&mut event.minted_list, buyer, true);

        // Gestion du paiement
        if (event.price == 0) {
            // Event gratuit : retourner le coin vide
            transfer::public_transfer(payment, buyer);
        } else {
            assert!(coin::value(&payment) >= event.price, EWrongAmount);
            coin::join(&mut event.balance, payment);
        };

        let ticket = Ticket {
            id: object::new(ctx),
            event_id: object::id(event),
            title: event.title,
            description: string::utf8(b"Ticket Kiosk - Non Verifie"),
            status: 0,
            rank: 0,
            url: string::utf8(b"https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=KioskTicket"),
        };

        // Place (non lock) pour permettre les transferts avant certification
        kiosk::place(kiosk, kiosk_cap, ticket);
    }

    // --- SELF CHECK-IN ---
    // Fonction permettant à l'utilisateur de se valider lui-même
    // en scannant le QR code unique affiché à l'entrée de l'événement
    public entry fun self_checkin(
        event: &Event,
        kiosk: &mut Kiosk,
        kiosk_cap: &KioskOwnerCap,
        ticket_id: ID,
        _ctx: &mut TxContext
    ) {
        // Vérifier que le check-in est ouvert
        assert!(event.checkin_enabled, ECheckinNotEnabled);
        
        // Emprunter le ticket depuis le Kiosk de l'utilisateur
        let ticket_mut = kiosk::borrow_mut<Ticket>(kiosk, kiosk_cap, ticket_id);
        
        // Vérifier que le ticket appartient bien à cet event
        assert!(ticket_mut.event_id == object::id(event), EWrongEvent);
        
        // Vérifier pas déjà scanné
        assert!(ticket_mut.status == 0, EAlreadyScanned);
        
        // Mettre à jour le NFT
        ticket_mut.status = 1;
        ticket_mut.description = string::utf8(b"Participant Verified ✓");
        ticket_mut.url = string::utf8(b"https://img.icons8.com/fluency/96/checked-user-male.png");
    }

    // --- TOGGLE CHECK-IN ---
    // Permet à l'organisateur d'activer/désactiver le check-in
    public entry fun toggle_checkin(
        cap: &OrganizerCap,
        event: &mut Event,
        enabled: bool,
        _ctx: &mut TxContext
    ) {
        assert!(object::id(event) == cap.event_id, ENotOrganizer);
        event.checkin_enabled = enabled;
    }

    // --- NOUVEAU : DISTRIBUTION DES PRIX (ESCROW) ---
    // Cette fonction prend la liste des gagnants et envoie l'argent automatiquement
    public entry fun distribute_prizes(
        cap: &OrganizerCap,
        event: &mut Event,
        winners: vector<address>, // Liste des adresses des gagnants (dans l'ordre du classement)
        ctx: &mut TxContext
    ) {
        assert!(object::id(event) == cap.event_id, ENotOrganizer);
        assert!(!event.prizes_distributed, EPrizesAlreadyDistributed);
        
        // On vérifie qu'on a autant de gagnants que de règles de prix définies
        let dist_len = vector::length(&event.prize_distribution);
        assert!(vector::length(&winners) == dist_len, EWinnerCountMismatch);

        // Calcul de la valeur totale de la pool (Total des ventes de tickets)
        // Note : On calcule sur la balance ACTUELLE. 
        let total_pool = coin::value(&event.balance);
        
        let mut i = 0;
        while (i < dist_len) {
            let winner_addr = *vector::borrow(&winners, i);
            let percent = *vector::borrow(&event.prize_distribution, i);
            
            // Calcul du montant : (Total * Pourcentage) / 100
            // Attention à l'overflow si les montants sont gigantesques, mais pour un hackathon u64 suffit souvent.
            // Pour être safe en prod, on utiliserait u128 pour le calcul intermédiaire.
            let prize_amount = (total_pool * percent) / 100;

            if (prize_amount > 0) {
                // On retire l'argent du coffre et on l'envoie au gagnant
                let prize_coin = coin::split(&mut event.balance, prize_amount, ctx);
                transfer::public_transfer(prize_coin, winner_addr);
            };
            
            // Stocker le rang (index 0 → rang 1, index 1 → rang 2, etc.)
            let rank = i + 1;
            table::add(&mut event.winner_ranks, winner_addr, rank);

            i = i + 1;
        };

        event.prizes_distributed = true;
        event.event_ended = true;  // Marquer l'event comme terminé
    }

    // --- CERTIFICATION DE PARTICIPATION ---
    // Permet aux participants de certifier leur NFT après la fin de l'event
    // Détecte automatiquement si le participant est gagnant et attribue le badge approprié
    // Si l'event est soulbound, le NFT devient non-transférable après certification
    public entry fun claim_certification(
        event: &Event,
        kiosk: &mut Kiosk,
        kiosk_cap: &KioskOwnerCap,
        _policy: &TransferPolicy<Ticket>,
        ticket_id: ID,
        ctx: &mut TxContext
    ) {
        // Vérifier que l'event est terminé
        assert!(event.event_ended, EEventNotEnded);
        
        // Emprunter le ticket depuis le Kiosk de l'utilisateur
        let ticket_mut = kiosk::borrow_mut<Ticket>(kiosk, kiosk_cap, ticket_id);
        
        // Vérifier que le ticket appartient bien à cet event
        assert!(ticket_mut.event_id == object::id(event), EWrongEvent);
        
        // Vérifier que le participant a bien check-in (status >= 1)
        assert!(ticket_mut.status >= 1, ENotCheckedIn);
        
        // Vérifier pas déjà certifié (status == 1 seulement)
        assert!(ticket_mut.status == 1, EAlreadyCertified);
        
        // Récupérer l'address du participant
        let participant = tx_context::sender(ctx);
        
        // Vérifier si le participant est un gagnant
        if (table::contains(&event.winner_ranks, participant)) {
            // GAGNANT - Récupérer le rang
            let rank = *table::borrow(&event.winner_ranks, participant);
            ticket_mut.rank = rank;  // ✅ Écrire le rang dans le NFT
            ticket_mut.status = 2;  // Status gagnant
            
            // Badges différenciés selon le rang
            if (rank == 1) {
                // 🥇 1ère place - Médaille d'or
                ticket_mut.description = string::utf8(b"🥇 1st Place Winner");
                ticket_mut.url = string::utf8(b"https://img.icons8.com/emoji/96/1st-place-medal-emoji.png");
            } else if (rank == 2) {
                // 🥈 2ème place - Médaille d'argent
                ticket_mut.description = string::utf8(b"🥈 2nd Place Winner");
                ticket_mut.url = string::utf8(b"https://img.icons8.com/emoji/96/2nd-place-medal-emoji.png");
            } else if (rank == 3) {
                // 🥉 3ème place - Médaille de bronze
                ticket_mut.description = string::utf8(b"🥉 3rd Place Winner");
                ticket_mut.url = string::utf8(b"https://img.icons8.com/emoji/96/3rd-place-medal-emoji.png");
            } else {
                // 🏆 Autres gagnants (4+) - Trophée avec rang
                ticket_mut.description = string::utf8(b"🏆 Winner - Certified");
                ticket_mut.url = string::utf8(b"https://img.icons8.com/fluency/96/trophy.png");
            };
        } else {
            // PARTICIPANT NORMAL - Certificat de participation
            ticket_mut.status = 3;
            ticket_mut.rank = 0;  // ✅ Pas de rang = 0
            ticket_mut.description = string::utf8(b"✓ Participation Certified");
            ticket_mut.url = string::utf8(b"https://img.icons8.com/color/96/certificate.png");
        };
        
        // Si l'event est soulbound, verrouiller définitivement le NFT après certification
        if (event.is_soulbound) {
            // Le NFT était "placed" (transférable), on le "lock" maintenant (non-transférable)
            let ticket = kiosk::take<Ticket>(kiosk, kiosk_cap, ticket_id);
            kiosk::lock(kiosk, kiosk_cap, _policy, ticket);
        };
    }

    // --- RETRAIT ORGANISATEUR (Modifié) ---
    // Permet de récupérer ce qui reste (si pas de prix, ou le reste après les prix)
    public entry fun withdraw_funds(
        cap: &OrganizerCap,
        event: &mut Event,
        ctx: &mut TxContext
    ) {
        assert!(object::id(event) == cap.event_id, ENotOrganizer);
        
        let amount = coin::value(&event.balance);
        if (amount > 0) {
            let profit = coin::split(&mut event.balance, amount, ctx);
            transfer::public_transfer(profit, tx_context::sender(ctx));
        };
    }
}
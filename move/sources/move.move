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
        winner_ranks: Table<ID, u64>,  // Stocke ticket_id → rang (1, 2, 3...)
        ticket_owners: Table<ID, address>,  // Stocke ticket_id → owner (pour distribute_prizes)
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
            ticket_owners: table::new(ctx),
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

        let ticket_uid = object::new(ctx);
        let ticket_id = object::uid_to_inner(&ticket_uid);
        
        let ticket = Ticket {
            id: ticket_uid,
            event_id: object::id(event),
            title: event.title,
            description: string::utf8(b"Ticket Kiosk - Non Verifie"),
            status: 0,
            rank: 0,
            url: string::utf8(b"https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=KioskTicket"),
        };

        // Stocker le mapping ticket_id → owner initial
        table::add(&mut event.ticket_owners, ticket_id, buyer);

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
    // Cette fonction prend la liste des ticket IDs gagnants et envoie l'argent aux propriétaires
    public entry fun distribute_prizes(
        cap: &OrganizerCap,
        event: &mut Event,
        winner_ticket_ids: vector<ID>, // Liste des ticket IDs gagnants (dans l'ordre du classement)
        ctx: &mut TxContext
    ) {
        assert!(object::id(event) == cap.event_id, ENotOrganizer);
        assert!(!event.prizes_distributed, EPrizesAlreadyDistributed);
        
        // On vérifie qu'on a autant de gagnants que de règles de prix définies
        let dist_len = vector::length(&event.prize_distribution);
        assert!(vector::length(&winner_ticket_ids) == dist_len, EWinnerCountMismatch);

        // Calcul de la valeur totale de la pool (Total des ventes de tickets)
        let total_pool = coin::value(&event.balance);
        
        let mut i = 0;
        while (i < dist_len) {
            let ticket_id = *vector::borrow(&winner_ticket_ids, i);
            let percent = *vector::borrow(&event.prize_distribution, i);
            
            // Récupérer l'owner du ticket depuis la table
            let winner_addr = *table::borrow(&event.ticket_owners, ticket_id);
            
            // Calcul du montant : (Total * Pourcentage) / 100
            let prize_amount = (total_pool * percent) / 100;

            if (prize_amount > 0) {
                // On retire l'argent du coffre et on l'envoie au propriétaire actuel du ticket
                let prize_coin = coin::split(&mut event.balance, prize_amount, ctx);
                transfer::public_transfer(prize_coin, winner_addr);
            };
            
            // Stocker le rang par ticket_id (index 0 → rang 1, index 1 → rang 2, etc.)
            let rank = i + 1;
            table::add(&mut event.winner_ranks, ticket_id, rank);

            i = i + 1;
        };

        event.prizes_distributed = true;
        event.event_ended = true;  // Marquer l'event comme terminé
    }

    // --- NOUVELLE FONCTION : ENREGISTRER LES RANGS COMPLETS ---
    // Permet à l'organisateur d'enregistrer le classement de tous les participants
    // (utilisé pour les marathons, compétitions, etc.)
    public entry fun set_final_rankings(
        cap: &OrganizerCap,
        event: &mut Event,
        ranked_ticket_ids: vector<ID>, // Liste ordonnée de tous les tickets (1er, 2ème, 3ème, ...)
        _ctx: &mut TxContext
    ) {
        assert!(object::id(event) == cap.event_id, ENotOrganizer);
        
        let len = vector::length(&ranked_ticket_ids);
        let mut i = 0;
        
        while (i < len) {
            let ticket_id = *vector::borrow(&ranked_ticket_ids, i);
            let rank = i + 1; // rang commence à 1
            
            // Ajouter ou mettre à jour le rang
            if (table::contains(&event.winner_ranks, ticket_id)) {
                // Si déjà présent (ex: via distribute_prizes), on ne fait rien
                // ou on pourrait mettre à jour si besoin
            } else {
                table::add(&mut event.winner_ranks, ticket_id, rank);
            };
            
            i = i + 1;
        };
        
        // Optionnel : marquer l'event comme terminé si pas déjà fait
        if (!event.event_ended) {
            event.event_ended = true;
        };
    }

    // --- CERTIFICATION DE PARTICIPATION ---
    // Permet aux participants de certifier leur NFT après la fin de l'event
    // Détecte automatiquement le rang du ticket et affiche dans la description
    // Si l'event est soulbound, le NFT devient non-transférable après certification
    public entry fun claim_certification(
        event: &Event,
        kiosk: &mut Kiosk,
        kiosk_cap: &KioskOwnerCap,
        _policy: &TransferPolicy<Ticket>,
        ticket_id: ID,
        _ctx: &mut TxContext
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
        
        // Tous les participants certifiés ont le même status
        ticket_mut.status = 2;  // Status: Certified
        
        // Vérifier si ce ticket a un rang enregistré
        if (table::contains(&event.winner_ranks, ticket_id)) {
            // CLASSÉ - Récupérer le rang
            let rank = *table::borrow(&event.winner_ranks, ticket_id);
            ticket_mut.rank = rank;
            
            // Badges et descriptions différenciés selon le rang
            if (rank == 1) {
                ticket_mut.description = string::utf8(b"Rank #1 - Gold Medal");
                ticket_mut.url = string::utf8(b"https://img.icons8.com/emoji/96/1st-place-medal-emoji.png");
            } else if (rank == 2) {
                ticket_mut.description = string::utf8(b"Rank #2 - Silver Medal");
                ticket_mut.url = string::utf8(b"https://img.icons8.com/emoji/96/2nd-place-medal-emoji.png");
            } else if (rank == 3) {
                ticket_mut.description = string::utf8(b"Rank #3 - Bronze Medal");
                ticket_mut.url = string::utf8(b"https://img.icons8.com/emoji/96/3rd-place-medal-emoji.png");
            } else {
                // Tous les autres rangs affichent leur position exacte
                // Note: Move ne permet pas de concaténer facilement des strings avec des nombres
                // Donc on affiche un message générique avec le rang stocké dans ticket.rank
                ticket_mut.description = string::utf8(b"Finisher - Ranked");
                ticket_mut.url = string::utf8(b"https://img.icons8.com/fluency/96/trophy.png");
            };
        } else {
            // PARTICIPANT NON CLASSÉ - Certificat de participation
            ticket_mut.rank = 0;  // Pas de rang
            ticket_mut.description = string::utf8(b"Participation Certified");
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
    document.addEventListener('DOMContentLoaded', function() {
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');
    const homeContent = document.getElementById('home-content');
    const closeBtns = document.querySelectorAll('.close-btn');
    
    // Gestione click su item della navbar
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Rimuovi la classe active da tutti gli item e contenuti
            navItems.forEach(navItem => navItem.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Aggiungi la classe active all'item cliccato
            this.classList.add('active');
            
            // Mostra il contenuto corrispondente
            const tabId = this.getAttribute('data-tab');
            
            if (tabId === 'home') {
                // Mostra la scheda principale
                homeContent.style.display = 'block';
            } else {
                // Mostra la tab selezionata e nascondi la scheda principale
                document.getElementById(tabId).classList.add('active');
                homeContent.style.display = 'none';
            }
        });
    });
    
    // Gestione click su pulsanti di chiusura
    closeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Nascondi tutti i contenuti tab
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Mostra la scheda principale
            homeContent.style.display = 'block';
            
            // Attiva il pulsante home nella navbar
            navItems.forEach(navItem => navItem.classList.remove('active'));
            document.querySelector('[data-tab="home"]').classList.add('active');
        });
    });

    // Gestione delle tab dei tratti
    function setupTraitTabs() {
        const traitTabButtons = document.querySelectorAll('.trait-tab-btn');
        const traitCategories = document.querySelectorAll('.trait-category');
        
        if (traitTabButtons.length > 0) {
            traitTabButtons.forEach(button => {
                button.addEventListener('click', function() {
                    // Rimuovi la classe active da tutti i pulsanti e categorie di tratti
                    traitTabButtons.forEach(btn => btn.classList.remove('active'));
                    traitCategories.forEach(category => category.classList.remove('active'));
                    
                    // Aggiungi la classe active al pulsante cliccato
                    this.classList.add('active');
                    
                    // Mostra la categoria corrispondente
                    const traitType = this.getAttribute('data-trait-type');
                    const targetCategory = document.getElementById(traitType + "-traits");
                    if (targetCategory) {
                        targetCategory.classList.add('active');
                    }
                });
            });
        }
    }
    
    // Esegui la funzione per le tab dei tratti
    setupTraitTabs();
});

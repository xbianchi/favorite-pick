'use strict';

async function init() {
    const evaluating = document.getElementById('evaluating');
    const showLoading = () => {
        evaluating.innerHTML = '<li class="notice">Cargando...</li>';
    };
    const showError = () => {
        evaluating.innerHTML = '<li class="notice">Error al cargar. <button id="retry">Reintentar</button></li>';
        document.getElementById('retry').addEventListener('click', init);
    };

    showLoading();

    try {
        const queens = await fetch('https://www.nokeynoshade.party/api/queens?limit=500')
            .then(res => res.json());

        items = queens.map(q => ({
            id: q.id,
            name: q.name,
            image: q.image_url,
            seasons: q.seasons || []
        }));

        franchiseSeasons = {};
        itemFranchises = {};
        itemSeasons = {};
        items.forEach(it => {
            it.seasons.forEach(s => {
                const slug = s.series && s.series.slug;
                const code = franchiseMap[slug];
                if (!code) return;
                itemFranchises[it.id] = code;
                if (!franchiseSeasons[code]) franchiseSeasons[code] = [];
                if (franchiseSeasons[code].indexOf(s.season_number) === -1) {
                    franchiseSeasons[code].push(s.season_number);
                }
                if (!itemSeasons[it.id]) {
                    itemSeasons[it.id] = s.season_number;
                }
            });
        });
        Object.keys(franchiseSeasons).forEach(f => franchiseSeasons[f].sort((a,b) => a - b));

        var myPicker = new picker.Picker({
            items: items,
            defaultSettings: { franchise: 'all', seasons: [], minBatchSize: 2, maxBatchSize: 2 },
            shouldIncludeItem: function(item, settings) {
                var franchise = settings.franchise || 'all';
                if (franchise !== 'all') {
                    var itemFranchise = itemFranchises[item.id] || 'usa';
                    if (itemFranchise !== franchise) {
                        return false;
                    }
                    var seasons = settings.seasons || [];
                    var available = franchiseSeasons[franchise] || [];
                    if (seasons.length === 0 || seasons.length === available.length) {
                        return true;
                    }
                    return seasons.indexOf(itemSeasons[item.id]) !== -1;
                }
                return true;
            }
        });
        var prevFavoritesLength = 0;
        var achievements = { total: 0, seasonCounts: {}, shantay: false };

        var pickerUI = new PickerUI(myPicker, {
            elements: {
                pick: "#pick",
                pass: "#pass",
                undo: "#undo",
                redo: "#redo",
                evaluating: "#evaluating",
                favorites: "#favorites",
                settings: {
                    franchise: "#franchise",
                    seasons: "input.season-checkbox",
                    minBatchSize: "#batch-size",
                    maxBatchSize: "#batch-size"
                }
            },
            onUpdate: function() {
                var currentLen = this.picker.getFavorites().length;
                if (currentLen > prevFavoritesLength) {
                    var $newItem = this.elem.favorites.children().last();
                    $newItem.addClass('favorite-animate');
                    setTimeout(function(){ $newItem.removeClass('favorite-animate'); }, 1000);

                    var newItems = this.picker.getFavorites().slice(prevFavoritesLength, currentLen);
                    newItems.forEach(function(it){
                        var season = itemSeasons[it.id];
                        achievements.seasonCounts[season] = (achievements.seasonCounts[season] || 0) + 1;
                    });
                    achievements.total = currentLen;

                    if (!achievements.shantay && achievements.total >= 50) {
                        alert('¡Shantay you slay!');
                        achievements.shantay = true;
                    }
                    for (var s in achievements.seasonCounts) {
                        if (achievements.seasonCounts[s] >= 5 && !achievements['season'+s]) {
                            alert('Superfan de Season ' + s + '!');
                            achievements['season'+s] = true;
                        }
                    }
                }
                prevFavoritesLength = currentLen;
            }
        });

        pickerUI.initialize();

        document.getElementById('share-results').addEventListener('click', function() {
            var favorites = myPicker.getFavorites().slice(0,10);
            var canvas = document.createElement('canvas');
            canvas.width = 600; canvas.height = 600;
            var ctx = canvas.getContext('2d');
            var gradient = ctx.createLinearGradient(0,0,600,600);
            gradient.addColorStop(0,'#ff4fd8');
            gradient.addColorStop(1,'#00d4ff');
            ctx.fillStyle = gradient;
            ctx.fillRect(0,0,600,600);
            ctx.fillStyle = '#fff';
            ctx.font = '28px Lobster';
            ctx.fillText('Mi Top Drag Queens:', 20, 40);
            ctx.font = '20px Poppins';
            favorites.forEach(function(it, i){
                ctx.fillText((i+1)+'. '+(it.name||it.id), 20, 80 + i*40);
            });
            ctx.fillText('#MyDragRaceTop', 20, 560);
            var link = document.createElement('a');
            link.download = 'top-drag-queens.png';
            link.href = canvas.toDataURL();
            link.click();
        });

        function bindSeasonCheckboxes(franchise) {
            pickerUI.elem.settings.seasons = $('input.season-checkbox');
            $('#select-all-seasons').on('change', function() {
                var checked = $(this).is(':checked');
                $('input.season-checkbox').prop('checked', checked);
                myPicker.setSettings(pickerUI.getSettings());
                pickerUI.update(true);
            });
            $('input.season-checkbox').on('change', function() {
                var allChecked = $('input.season-checkbox:checked').length === (franchiseSeasons[franchise] || []).length;
                $('#select-all-seasons').prop('checked', allChecked);
                myPicker.setSettings(pickerUI.getSettings());
                pickerUI.update(true);
            });
        }

        function populateSeasonCheckboxes(franchise) {
            var container = $('#season-select');
            container.empty();
            if (franchise === 'all') {
                pickerUI.elem.settings.seasons = $('input.season-checkbox');
                myPicker.setSettings(pickerUI.getSettings());
                pickerUI.update(true);
                return;
            }
            var seasons = franchiseSeasons[franchise] || [];
            var html = '<label><input type="checkbox" id="select-all-seasons" checked> Todas las temporadas</label>';
            for (var i = 0; i < seasons.length; i++) {
                html += '<label><input type="checkbox" name="season" class="season-checkbox setting-number" value="' + seasons[i] + '" checked> ' + seasons[i] + '</label>';
            }
            container.html(html);
            bindSeasonCheckboxes(franchise);
            myPicker.setSettings(pickerUI.getSettings());
            pickerUI.update(true);
        }

        $('#franchise').on('change', function() {
            populateSeasonCheckboxes($(this).val());
        });

        populateSeasonCheckboxes($('#franchise').val());

        var sortable = new Sortable(pickerUI.elem.favorites.get(0), {
            draggable: '.item',
            animation: 100,
            onStart: function() {
                pickerUI.elem.favorites.addClass("sorting");
            },
            onEnd: function() {
                pickerUI.elem.favorites.removeClass("sorting");
            },
            onUpdate: function() {
                myPicker.setFavorites(pickerUI.elem.favorites.children().map(function() {
                    return pickerUI.getItem(this);
                }).get());
                pickerUI.update(true);
            }
        });
    } catch (err) {
        console.error(err);
        showError();
    }
}

init();

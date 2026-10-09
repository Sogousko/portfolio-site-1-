
"use strict";

// ========================================
// 1. CSVファイルを読み込む
// ========================================

fetch("./works.csv")
    .then(function(response) {
        if (!response.ok) {
            throw new Error("works.csvを読み込めませんでした");
        }

        return response.text();
    })

    .then(function(data) {

        // ========================================
        // 2. CSVを解析する
        // ========================================

        var rows = data.trim().split(/\r?\n/);

        if (rows.length < 2) {
            throw new Error("CSVに作品データがありません");
        }

        var headers = rows[0].replace(/^\uFEFF/, "")
            .split(",")
            .map(function(header) {
                return header.trim();
            });

        var works = [];

        for (var i = 1; i < rows.length; i++) {

            if (rows[i].trim() === "") {
                continue;
            }

            var values = rows[i].split(",");
            var work = {};

            headers.forEach(function(header, index) {
                work[header] = (values[index] || "").trim();
            });

            // 必要な項目がない場合に備える
            work.title = work.title || "タイトル未設定";
            work.description = work.description || "説明はありません";
            work.image = work.image || "";
            work.category = work.category || "その他";
            work.year = work.year || "0";

            works.push(work);
        }

        console.log("読み込んだ作品数:", works.length);
        console.log("作品データ:", works);


        // ========================================
        // 3. HTMLの要素を取得する
        // ========================================

        var grid = document.getElementById("works-grid");
        var categorySelect = document.getElementById("category");
        var sortSelect = document.getElementById("sort");

        if (!grid || !categorySelect || !sortSelect) {
            console.error(
                "works-grid、category、sortのIDをHTMLで確認してください"
            );
            return;
        }


        // ========================================
        // 4. カテゴリー一覧を作成する
        // ========================================

        // 「すべて」を最初に表示
        categorySelect.innerHTML =
            '<option value="all">すべてのカテゴリー</option>';

        var categories = [];

        works.forEach(function(work) {
            if (!categories.includes(work.category)) {
                categories.push(work.category);
            }
        });

        categories.forEach(function(category) {
            var option = document.createElement("option");

            option.value = category;
            option.textContent = category;

            categorySelect.appendChild(option);
        });


        // ========================================
        // 5. 作品を表示する関数
        // ========================================

        function displayWorks() {

            var selectedCategory = categorySelect.value;
            var sortType = sortSelect.value;

            // 元の作品データをコピーする
            var displayList = works.slice();


            // ----------------------------------------
            // カテゴリーで絞り込む
            // ----------------------------------------

            if (selectedCategory !== "all") {
                displayList = displayList.filter(function(work) {
                    return work.category === selectedCategory;
                });
            }


            // ----------------------------------------
            // 並び替える
            // ----------------------------------------

            if (sortType === "new") {
                displayList.sort(function(a, b) {
                    return Number(b.year) - Number(a.year);
                });

            } else if (sortType === "old") {
                displayList.sort(function(a, b) {
                    return Number(a.year) - Number(b.year);
                });

            } else if (sortType === "title") {
                displayList.sort(function(a, b) {
                    return a.title.localeCompare(b.title, "ja");
                });
            }


            // ----------------------------------------
            // 現在の作品表示をクリアする
            // ----------------------------------------

            grid.innerHTML = "";


            // ----------------------------------------
            // 作品がない場合
            // ----------------------------------------

            if (displayList.length === 0) {
                var message = document.createElement("p");
                message.textContent = "該当する作品がありません。";
                grid.appendChild(message);
                return;
            }


            // ----------------------------------------
            // 作品カードを作成する
            // ----------------------------------------

            displayList.forEach(function(work) {

                var card = document.createElement("article");
                card.className = "work-card";

                // 画像を作成
                if (work.image) {
                    var img = document.createElement("img");

                    img.src = work.image;
                    img.alt = work.title;
                    img.loading = "lazy";

                    // 画像が見つからない場合
                    img.addEventListener("error", function() {
                        console.error("画像を読み込めません:", work.image);
                        img.alt = work.title + "（画像を読み込めません）";
                    });

                    card.appendChild(img);
                }

                // 作品情報を作成
                var info = document.createElement("div");
                info.className = "works-info";

                var category = document.createElement("p");
                category.className = "work-category";
                category.textContent = work.category;

                var title = document.createElement("h4");
                title.textContent = work.title;

                var description = document.createElement("p");
                description.textContent = work.description;

                var year = document.createElement("p");
                year.className = "work-year";
                year.textContent =
                    work.year === "0" ? "" : work.year + "年";

                info.appendChild(category);
                info.appendChild(title);
                info.appendChild(description);
                info.appendChild(year);

                card.appendChild(info);
                grid.appendChild(card);
            });

            console.log("現在の表示作品数:", displayList.length);
        }


        // ========================================
        // 6. 最初の作品を表示する
        // ========================================

        displayWorks();


        // ========================================
        // 7. カテゴリー変更時に再表示する
        // ========================================

        categorySelect.addEventListener("change", function() {
            displayWorks();
        });


        // ========================================
        // 8. 並び順変更時に再表示する
        // ========================================

        sortSelect.addEventListener("change", function() {
            displayWorks();
        });

    })

    // ========================================
    // 9. CSV読み込みのエラー処理
    // ========================================

    .catch(function(error) {
        console.error("作品データの読み込みに失敗しました:", error);

        var grid = document.getElementById("works-grid");

        if (grid) {
            grid.textContent =
                "作品を読み込めませんでした。works.csvの場所を確認してください。";
        }
    });


// ========================================
// 10. 天気情報を取得する
// ========================================

var latitude = 35.6895;
var longitude = 139.6917;

var weatherUrl =
    "https://api.open-meteo.com/v1/forecast" +
    "?latitude=" + latitude +
    "&longitude=" + longitude +
    "&current=temperature_2m,weather_code" +
    "&timezone=Asia%2FTokyo";

fetch(weatherUrl)
    .then(function(response) {
        if (!response.ok) {
            throw new Error("天気情報を取得できませんでした");
        }

        return response.json();
    })

    .then(function(data) {

        if (!data.current) {
            throw new Error("天気データがありません");
        }

        var weatherCode = data.current.weather_code;
        var temperature = data.current.temperature_2m;

        showWeather(weatherCode, temperature);
    })

    .catch(function(error) {
        console.error("天気情報の取得に失敗しました:", error);

        var icon = document.getElementById("weather-icon");

        if (icon) {
            icon.textContent = "天気情報を取得できません";
        }
    });


// ========================================
// 11. 天気情報を画面に表示する
// ========================================

function showWeather(code, temperature) {

    var icon = document.getElementById("weather-icon");

    if (!icon) {
        console.error("weather-iconがHTMLにありません");
        return;
    }

    var weatherText = "";
    var weatherSymbol = "";

    if (code === 0) {
        weatherText = "晴れ";
        weatherSymbol = "☀";

    } else if (code >= 1 && code <= 3) {
        weatherText = "くもり";
        weatherSymbol = "☁";

    } else if (code >= 45 && code <= 48) {
        weatherText = "霧";
        weatherSymbol = "🌫";

    } else if (code >= 51 && code <= 67) {
        weatherText = "雨";
        weatherSymbol = "☂";

    } else if (code >= 71 && code <= 86) {
        weatherText = "雪";
        weatherSymbol = "❄";

    } else if (code >= 95) {
        weatherText = "雷雨";
        weatherSymbol = "⚡";

    } else {
        weatherText = "くもり";
        weatherSymbol = "☁";
    }

    icon.textContent =
        weatherSymbol + " " +
        weatherText + " " +
        temperature + "℃";

    // 天気に応じて背景クラスを変更
    document.body.classList.remove(
        "weather-sunny",
        "weather-cloudy",
        "weather-rainy"
    );

    if (code === 0) {
        document.body.classList.add("weather-sunny");

    } else if (code >= 51 && code <= 67) {
        document.body.classList.add("weather-rainy");

    } else {
        document.body.classList.add("weather-cloudy");
    }
}









        
    
    
    
    
    
    
    




        





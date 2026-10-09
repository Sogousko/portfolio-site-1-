
"use strict";

// ========================================
// 1. CSVを解析する関数
// ========================================

function parseCSV(text) {
    var rows = [];
    var row = [];
    var value = "";
    var insideQuotes = false;

    // 先頭のBOMを取り除く
    text = text.replace(/^\uFEFF/, "");

    for (var i = 0; i < text.length; i++) {
        var char = text[i];
        var next = text[i + 1];

        if (char === '"') {
            // "" は文字としてのダブルクォート
            if (insideQuotes && next === '"') {
                value += '"';
                i++;
            } else {
                insideQuotes = !insideQuotes;
            }
        } else if (char === "," && !insideQuotes) {
            row.push(value.trim());
            value = "";
        } else if (
            (char === "\n" || char === "\r") &&
            !insideQuotes
        ) {
            if (char === "\r" && next === "\n") {
                i++;
            }

            row.push(value.trim());

            if (row.some(function(item) {
                return item !== "";
            })) {
                rows.push(row);
            }

            row = [];
            value = "";
        } else {
            value += char;
        }
    }

    // 最後の行を追加
    row.push(value.trim());

    if (row.some(function(item) {
        return item !== "";
    })) {
        rows.push(row);
    }

    if (rows.length < 2) {
        throw new Error("CSVに作品データがありません");
    }

    var headers = rows[0].map(function(header) {
        return header.trim();
    });

    return rows.slice(1).map(function(values) {
        var work = {};

        headers.forEach(function(header, index) {
            work[header] = (values[index] || "").trim();
        });

        return {
            title: work.title || "タイトル未設定",
            description: work.description || "説明はありません",
            image: work.image || "",
            category: work.category || "その他",
            year: work.year || ""
        };
    });
}


// ========================================
// 2. HTMLの要素を取得
// ========================================

var grid = document.getElementById("works-grid");
var categorySelect = document.getElementById("category");
var sortSelect = document.getElementById("sort");
var worksCount = document.getElementById("works-count");

var allWorks = [];


// ========================================
// 3. CSVを読み込む
// ========================================

fetch("./works.csv")
    .then(function(response) {
        if (!response.ok) {
            throw new Error(
                "works.csvの読み込みに失敗しました"
            );
        }

        return response.text();
    })
    .then(function(text) {
        allWorks = parseCSV(text);

        // データが正しく読み込めたか確認
        console.log("作品データ:", allWorks);

        createCategoryOptions();
        displayWorks();
    })
    .catch(function(error) {
        console.error(error);

        if (grid) {
            grid.textContent =
                "作品を読み込めませんでした。" +
                "works.csvの場所やCSVの内容を確認してください。";
        }

        if (worksCount) {
            worksCount.textContent = "読み込みエラー";
        }
    });


// ========================================
// 4. カテゴリを自動生成
// ========================================

function createCategoryOptions() {
    var categories = [];

    allWorks.forEach(function(work) {
        if (
            work.category &&
            !categories.includes(work.category)
        ) {
            categories.push(work.category);
        }
    });

    categories.sort(function(a, b) {
        return a.localeCompare(b, "ja");
    });

    categorySelect.innerHTML = "";

    var allOption = document.createElement("option");
    allOption.value = "all";
    allOption.textContent = "すべてのカテゴリ";
    categorySelect.appendChild(allOption);

    categories.forEach(function(category) {
        var option = document.createElement("option");

        option.value = category;
        option.textContent = category;

        categorySelect.appendChild(option);
    });
}


// ========================================
// 5. 作品の絞り込み・並び替え
// ========================================

function displayWorks() {
    if (!grid || !categorySelect || !sortSelect) {
        return;
    }

    var selectedCategory = categorySelect.value;
    var sortType = sortSelect.value;

    // 元データを壊さないようにコピーする
    var displayList = allWorks.slice();

    // カテゴリで絞り込み
    if (selectedCategory !== "all") {
        displayList = displayList.filter(function(work) {
            return work.category === selectedCategory;
        });
    }

    // 並び替え
    if (sortType === "new") {
        displayList.sort(function(a, b) {
            return (Number(b.year) || 0) -
                   (Number(a.year) || 0);
        });
    } else if (sortType === "old") {
        displayList.sort(function(a, b) {
            return (Number(a.year) || 0) -
                   (Number(b.year) || 0);
        });
    } else if (sortType === "title") {
        displayList.sort(function(a, b) {
            return a.title.localeCompare(b.title, "ja");
        });
    }

    // 表示をいったん消去
    grid.replaceChildren();

    // 表示件数を更新
    if (worksCount) {
        worksCount.textContent =
            "全 " + displayList.length + " 件の作品";
    }

    // 該当作品がない場合
    if (displayList.length === 0) {
        var empty = document.createElement("p");

        empty.className = "empty-message";
        empty.textContent = "該当する作品がありません。";

        grid.appendChild(empty);
        return;
    }

    // 作品カードを作成
    displayList.forEach(function(work, index) {
        var card = document.createElement("article");
        card.className = "work-card";

        // 作品画像
        if (work.image) {
            var img = document.createElement("img");

            img.className = "work-image";
            img.src = work.image;
            img.alt = work.title + "の作品画像";
            img.loading = "lazy";

            // 画像が見つからない場合の表示
            img.addEventListener("error", function() {
                var placeholder =
                    document.createElement("div");

                placeholder.className = "image-placeholder";
                placeholder.textContent = "IMAGE NOT FOUND";

                img.replaceWith(placeholder);
            }, { once: true });

            card.appendChild(img);
        } else {
            var placeholder =
                document.createElement("div");

            placeholder.className = "image-placeholder";
            placeholder.textContent = "NO IMAGE";

            card.appendChild(placeholder);
        }

        // 作品情報の領域
        var info = document.createElement("div");
        info.className = "works-info";

        // 番号
        var number = document.createElement("p");
        number.className = "work-number";
        number.textContent =
            "PROJECT / " +
            String(index + 1).padStart(2, "0");

        // カテゴリ
        var category = document.createElement("p");
        category.className = "work-category";
        category.textContent = work.category;

        // タイトル
        var title = document.createElement("h3");
        title.textContent = work.title;

        // 説明
        var description = document.createElement("p");
        description.className = "work-description";
        description.textContent = work.description;

        // 制作年
        var year = document.createElement("p");
        year.className = "work-year";
        year.textContent = work.year
            ? "制作年 / " + work.year
            : "制作年 / 未設定";

        // カードに追加
        info.appendChild(number);
        info.appendChild(category);
        info.appendChild(title);
        info.appendChild(description);
        info.appendChild(year);

        card.appendChild(info);
        grid.appendChild(card);
    });
}


// ========================================
// 6. 操作時に作品を再表示
// ========================================

if (categorySelect) {
    categorySelect.addEventListener(
        "change",
        displayWorks
    );
}

if (sortSelect) {
    sortSelect.addEventListener(
        "change",
        displayWorks
    );
}


// ========================================
// 7. 天気情報を取得
// ========================================

// 川崎市付近の座標
var latitude = 35.5308;
var longitude = 139.7036;

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

        showWeather(
            data.current.weather_code,
            data.current.temperature_2m
        );
    })
    .catch(function(error) {
        console.error("天気情報エラー:", error);

        var weather = document.getElementById("weather-icon");

        if (weather) {
            weather.textContent =
                "天気情報は現在利用できません";
        }
    });


// ========================================
// 8. 天気を表示し、アクセントカラーを変更
// ========================================

function showWeather(code, temperature) {
    var weather = document.getElementById("weather-icon");

    if (!weather) {
        return;
    }

    var symbol = "☁";
    var description = "くもり";
    var theme = "weather-cloudy";

    if (code === 0) {
        symbol = "☀";
        description = "晴れ";
        theme = "weather-sunny";
    } else if (code >= 1 && code <= 3) {
        symbol = "☁";
        description = "くもり";
        theme = "weather-cloudy";
    } else if (code >= 45 && code <= 48) {
        symbol = "🌫";
        description = "霧";
        theme = "weather-cloudy";
    } else if (code >= 51 && code <= 67) {
        symbol = "☂";
        description = "雨";
        theme = "weather-rainy";
    } else if (code >= 71 && code <= 86) {
        symbol = "❄";
        description = "雪";
        theme = "weather-cloudy";
    } else if (code >= 95) {
        symbol = "⚡";
        description = "雷雨";
        theme = "weather-rainy";
    }

    weather.textContent =
        symbol + " " + description + " / " +
        temperature + "℃";

    document.body.classList.remove(
        "weather-sunny",
        "weather-cloudy",
        "weather-rainy"
    );

    document.body.classList.add(theme);
}









        
    
    
    
    
    
    
    




        





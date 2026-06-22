// ============================================================
// 选菜软件 — Alpine.js 应用逻辑
// ============================================================

document.addEventListener("alpine:init", () => {
  Alpine.data("app", () => ({
    // ---- 视图状态 ----
    view: "words", // "words" | "sets" | "list"
    transitioning: false,

    // ---- 情景词 ----
    words: [], // 当前展示的 6 个词
    selectedWord: null,
    refreshing: false,

    // ---- 菜谱套餐 ----
    mealSets: [], // 3 套完整午餐
    selectedSetIndex: null,

    // ---- 食材清单 ----
    groupedIngredients: [], // [{category, items: [{name, amount, unit, special}]}]

    // ---- 初始化 ----
    init() {
      this.shuffleWords();
    },

    // ---- 随机选取 6 个情景词 ----
    shuffleWords() {
      this.refreshing = true;
      const shuffled = [...SCENARIO_WORDS].sort(() => Math.random() - 0.5);
      this.words = shuffled.slice(0, 6);

      setTimeout(() => {
        this.refreshing = false;
      }, 350);
    },

    // ---- 选择情景词 → 生成套餐 ----
    selectWord(word) {
      this.selectedWord = word;
      this.selectedSetIndex = null;
      this.generateMealSets(word);

      this.transitioning = true;
      setTimeout(() => {
        this.view = "sets";
        this.transitioning = false;
      }, 250);
    },

    // ---- 是否为辣菜 ----
    isSpicy(recipe) {
      return recipe.elements.some((e) => e === "spicy" || e === "zingy");
    },

    // ---- 生成 3 套午餐 ----
    generateMealSets(word) {
      const wordEls = word.elements;

      // 元素匹配 + 辣菜加权 (+2 分, 让辣菜更容易被选到)
      const scored = RECIPES.map((r) => {
        const overlap = r.elements.filter((e) => wordEls.includes(e)).length;
        const spicyBonus = this.isSpicy(r) ? 2 : 0;
        const noise = Math.random() * 0.5;
        return { recipe: r, score: overlap + spicyBonus + noise };
      });

      scored.sort((a, b) => b.score - a.score);

      // 分离荤、素、汤，每个品类内再分辣/不辣
      const meats = scored.filter((s) => s.recipe.cat === "荤");
      const veggies = scored.filter((s) => s.recipe.cat === "素");
      const soups = scored.filter((s) => s.recipe.cat === "汤");

      const spicyMeats = meats.filter((s) => this.isSpicy(s.recipe));
      const mildMeats = meats.filter((s) => !this.isSpicy(s.recipe));
      const spicyVeggies = veggies.filter((s) => this.isSpicy(s.recipe));
      const mildVeggies = veggies.filter((s) => !this.isSpicy(s.recipe));

      const topSpicyMeats = spicyMeats.slice(0, 12);
      const topMildMeats = mildMeats.slice(0, 8);
      const topSpicyVeggies = spicyVeggies.slice(0, 10);
      const topMildVeggies = mildVeggies.slice(0, 8);
      const topSoups = soups.slice(0, 6);

      const sets = [];
      const usedRecipeIds = new Set();

      // 每套的辣菜目标: [2, 2, 1] → 大部分 2 辣, 最少 1 辣
      const spicyTargets = [2, 2, 1];

      for (let i = 0; i < 3; i++) {
        const setRecipes = [];
        const spicyTarget = spicyTargets[i];

        // ---- 选荤菜: 优先保证辣菜数量 ----
        const spicyNeededFromMeat = Math.min(2, spicyTarget);

        // 先选辣荤菜
        for (let m = 0; m < spicyNeededFromMeat; m++) {
          const pick = topSpicyMeats.find((x) => !usedRecipeIds.has(x.recipe.id));
          if (pick) {
            setRecipes.push(pick.recipe);
            usedRecipeIds.add(pick.recipe.id);
          }
        }

        // 补足到 2 道荤菜 (用不辣的)
        while (setRecipes.filter((r) => r.cat === "荤").length < 2) {
          const pick = topMildMeats.find((x) => !usedRecipeIds.has(x.recipe.id));
          if (pick) {
            setRecipes.push(pick.recipe);
            usedRecipeIds.add(pick.recipe.id);
          } else {
            // 后备: 从全量辣荤菜中找
            const fallback = spicyMeats.find((m) => !usedRecipeIds.has(m.recipe.id));
            if (fallback) {
              setRecipes.push(fallback.recipe);
              usedRecipeIds.add(fallback.recipe.id);
            } else break;
          }
        }

        // 确保荤菜至少 1 道辣
        const meatSpicyCount = setRecipes.filter((r) => r.cat === "荤" && this.isSpicy(r)).length;
        if (meatSpicyCount === 0 && setRecipes.length >= 1) {
          // 把第一道不辣荤菜替换为辣荤菜
          const mildIdx = setRecipes.findIndex((r) => r.cat === "荤" && !this.isSpicy(r));
          if (mildIdx >= 0) {
            const oldId = setRecipes[mildIdx].id;
            usedRecipeIds.delete(oldId);
            const spicyPick = spicyMeats.find((m) => !usedRecipeIds.has(m.recipe.id));
            if (spicyPick) {
              setRecipes[mildIdx] = spicyPick.recipe;
              usedRecipeIds.add(spicyPick.recipe.id);
            } else {
              usedRecipeIds.add(oldId); // 恢复
            }
          }
        }

        // ---- 选素菜: 优先辣素菜凑够目标 ----
        const currentSpicy = setRecipes.filter((r) => this.isSpicy(r)).length;
        const spicyNeededFromVeg = Math.max(0, spicyTarget - currentSpicy);

        // 先选辣素菜
        for (let v = 0; v < spicyNeededFromVeg && setRecipes.length < 5; v++) {
          const pick = topSpicyVeggies.find((x) => !usedRecipeIds.has(x.recipe.id));
          if (pick) {
            setRecipes.push(pick.recipe);
            usedRecipeIds.add(pick.recipe.id);
          }
        }

        // 补足素菜到至少 3 道总菜 (素菜凑数)
        while (setRecipes.length < 3) {
          const vegPick = mildVeggies.find((x) => !usedRecipeIds.has(x.recipe.id));
          if (vegPick) {
            setRecipes.push(vegPick.recipe);
            usedRecipeIds.add(vegPick.recipe.id);
          } else break;
        }

        // 再加 1 道素菜让套餐更丰富 (如果还没到 4 道)
        if (setRecipes.length < 4) {
          const extra = [...topSpicyVeggies, ...topMildVeggies].find(
            (x) => !usedRecipeIds.has(x.recipe.id)
          );
          if (extra) {
            setRecipes.push(extra.recipe);
            usedRecipeIds.add(extra.recipe.id);
          }
        }

        // ---- 偶尔加汤 ----
        const soup = topSoups.find((s) => !usedRecipeIds.has(s.recipe.id));
        const anySetHasSoup = sets.some((s) => s.recipes.some((r) => r.cat === "汤"));
        const shouldAddSoup = (Math.random() < 0.5 && soup) || (i === 2 && !anySetHasSoup);
        if (shouldAddSoup && soup && setRecipes.length < 5) {
          setRecipes.push(soup.recipe);
          usedRecipeIds.add(soup.recipe.id);
        }

        // ---- 最后兜底: 确保至少1辣 + 至少4菜 ----
        while (setRecipes.length < 4) {
          const extra = [...topSpicyVeggies, ...topMildVeggies, ...topSpicyMeats, ...topMildMeats].find(
            (x) => !usedRecipeIds.has(x.recipe.id)
          );
          if (extra) {
            setRecipes.push(extra.recipe);
            usedRecipeIds.add(extra.recipe.id);
          } else break;
        }

        const finalSpicy = setRecipes.filter((r) => this.isSpicy(r)).length;
        if (finalSpicy === 0) {
          // 强制至少 1 辣: 替换最后一道不辣菜
          for (let j = setRecipes.length - 1; j >= 0; j--) {
            if (!this.isSpicy(setRecipes[j])) {
              const oldId = setRecipes[j].id;
              usedRecipeIds.delete(oldId);
              const allSpicy = [...spicyMeats, ...spicyVeggies].find(
                (s) => !usedRecipeIds.has(s.recipe.id)
              );
              if (allSpicy) {
                setRecipes[j] = allSpicy.recipe;
                usedRecipeIds.add(allSpicy.recipe.id);
              } else {
                usedRecipeIds.add(oldId);
              }
              break;
            }
          }
        }

        sets.push({
          id: i + 1,
          recipes: setRecipes,
          label: this.getSetLabel(i),
        });
      }

      this.mealSets = sets;
    },

    // ---- 套餐标签 ----
    getSetLabel(index) {
      const labels = ["方案一", "方案二", "方案三"];
      return labels[index] || `方案${index + 1}`;
    },

    // ---- 套餐菜谱数 ----
    setDishCount(set) {
      const cats = set.recipes.map((r) => r.cat);
      const parts = [];
      const meatCount = cats.filter((c) => c === "荤").length;
      const vegCount = cats.filter((c) => c === "素").length;
      const soupCount = cats.filter((c) => c === "汤").length;
      if (meatCount) parts.push(`${meatCount}荤`);
      if (vegCount) parts.push(`${vegCount}素`);
      if (soupCount) parts.push(`${soupCount}汤`);
      return parts.join("·");
    },

    // ---- 选择套餐 → 生成清单 ----
    selectSet(index) {
      this.selectedSetIndex = index;
    },

    generateList() {
      if (this.selectedSetIndex === null) return;

      const selectedSet = this.mealSets[this.selectedSetIndex];
      if (!selectedSet) return;

      // 合并所有食材
      const ingredientMap = new Map();

      selectedSet.recipes.forEach((recipe) => {
        recipe.ingredients.forEach((ing) => {
          const key = ing.n;
          if (ingredientMap.has(key)) {
            const existing = ingredientMap.get(key);
            // 简单累加（同单位才加，不同单位保留）
            if (existing.u === ing.u) {
              existing.a += ing.a;
            } else {
              // 不同单位，保留为单独条目
              ingredientMap.set(key + "（另计）", { ...ing });
              return;
            }
          } else {
            ingredientMap.set(key, { ...ing });
          }
        });
      });

      // 分类
      const categories = {
        肉类: [],
        蔬菜菌菇: [],
        豆蛋奶: [],
        调料干货: [],
        特殊食材: [],
      };

      const meatKeywords = [
        "肉", "鸡", "鸭", "鱼", "虾", "蟹", "贝", "牛", "羊", "猪",
        "排骨", "牛腩", "里脊", "腿", "翅", "蛤", "鱿", "蛙",
        "肥牛", "腊肉", "腊肠", "火腿",
      ];
      const vegKeywords = [
        "菜", "瓜", "豆", "椒", "茄", "菇", "笋", "藕", "薯",
        "芹", "蒜", "葱", "姜", "花菜", "萝卜", "山药", "玉米",
        "番茄", "西红柿", "土豆", "洋葱", "木耳", "海带",
        "秋葵", "芦笋", "茼蒿", "菠菜", "生菜", "空心菜",
        "娃娃菜", "豌豆", "豆芽", "韭菜", "上海青",
        "包菜", "圆白菜", "白菜", "西兰花", "花椰菜",
        "莴笋", "丝瓜", "冬瓜", "南瓜", "黄瓜", "苦瓜",
        "金针菇", "杏鲍菇", "香菇", "茶树菇",
      ];
      const eggTofuKeywords = ["蛋", "豆腐", "豆干", "香干", "腐竹", "豆皮", "烤麸"];
      const seasoningKeywords = [
        "酱", "油", "醋", "糖", "盐", "粉", "精", "酒",
        "辣椒", "花椒", "八角", "桂皮", "香叶", "茴香",
        "孜然", "胡椒", "咖喱", "蚝油", "豉油", "蒸鱼豉油",
        "水淀粉", "淀粉", "鸡精", "味精", "冰糖",
      ];

      const allItems = Array.from(ingredientMap.values());

      allItems.forEach((item) => {
        const name = item.n;
        if (item.s) {
          categories["特殊食材"].push(item);
        } else if (meatKeywords.some((k) => name.includes(k))) {
          categories["肉类"].push(item);
        } else if (eggTofuKeywords.some((k) => name.includes(k))) {
          categories["豆蛋奶"].push(item);
        } else if (vegKeywords.some((k) => name.includes(k))) {
          categories["蔬菜菌菇"].push(item);
        } else if (seasoningKeywords.some((k) => name.includes(k))) {
          categories["调料干货"].push(item);
        } else {
          categories["蔬菜菌菇"].push(item);
        }
      });

      // 移除空分类
      this.groupedIngredients = Object.entries(categories)
        .filter(([, items]) => items.length > 0)
        .map(([category, items]) => ({ category, items }));

      this.transitioning = true;
      setTimeout(() => {
        this.view = "list";
        this.transitioning = false;
      }, 250);
    },

    // ---- 返回重来 ----
    reset() {
      this.transitioning = true;
      setTimeout(() => {
        this.view = "words";
        this.selectedWord = null;
        this.selectedSetIndex = null;
        this.mealSets = [];
        this.groupedIngredients = [];
        this.transitioning = false;
        this.shuffleWords();
      }, 250);
    },

    // ---- 返回套餐选择 ----
    backToSets() {
      this.transitioning = true;
      setTimeout(() => {
        this.view = "sets";
        this.transitioning = false;
      }, 250);
    },

    // ---- 格式化食材数量 ----
    formatAmount(item) {
      if (Number.isInteger(item.a)) {
        return item.a;
      }
      return item.a;
    },

    // ---- 复制清单到剪贴板 ----
    async copyList() {
      let text = "🛒 食材清单\n";
      text += "━━━━━━━━━━━━\n\n";

      this.groupedIngredients.forEach((group) => {
        text += `【${group.category}】\n`;
        group.items.forEach((item) => {
          text += `  · ${item.n} — ${this.formatAmount(item.a)}${item.u}`;
          if (item.s) text += " ⚡";
          text += "\n";
        });
        text += "\n";
      });

      try {
        await navigator.clipboard.writeText(text);
        this.showToast("已复制到剪贴板 ✅");
      } catch {
        this.showToast("复制失败，请截图保存");
      }
    },

    // ---- Toast 提示 ----
    toastMsg: "",
    toastVisible: false,
    toastTimer: null,

    showToast(msg) {
      this.toastMsg = msg;
      this.toastVisible = true;
      clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => {
        this.toastVisible = false;
      }, 2000);
    },

    // ---- 获取元素名称 ----
    elementName(key) {
      return ELEMENTS[key]?.name || key;
    },
  }));
});

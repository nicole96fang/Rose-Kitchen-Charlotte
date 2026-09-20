import {
  createStore,
  blankRecipe
} from "./store.js";

const store = createStore();

const $ = (selector, root = document) =>
  root.querySelector(selector);

const $$ = (selector, root = document) =>
  [...root.querySelectorAll(selector)];

let currentPage = "home";
let currentCategory = null;
let editingRecipe = null;
let searchText = "";

const app = document.createElement("div");
app.id = "app";
document.body.innerHTML = "";
document.body.appendChild(app);

function escapeHTML(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function category(id) {
  return store.categories.find(
    item => item.id === id
  );
}

function recipes() {
  return store.getState().recipes || [];
}

function categoryRecipes(id) {
  return recipes().filter(
    recipe =>
      recipe.categoryId === id
  );
}

function showPage(page) {
  currentPage = page;
  editingRecipe = null;
  render();
}

function showCategory(id) {
  currentCategory = id;
  currentPage = "category";
  editingRecipe = null;
  render();
}

function newRecipe(categoryId) {
  currentCategory = categoryId;

  editingRecipe = blankRecipe(
    categoryId
  );

  currentPage = "editor";

  render();
}

function editRecipe(recipe) {
  editingRecipe = structuredClone(
    recipe
  );

  currentCategory =
    recipe.categoryId;

  currentPage = "editor";

  render();
}

function iconForCategory(id) {
  const item = category(id);

  return item
    ? item.icon
    : "/assets/icons/other.png";
}

function render() {
  const state = store.getState();

  if (currentPage === "home") {
    renderHome(state);
    return;
  }

  if (currentPage === "category") {
    renderCategory(state);
    return;
  }

  if (currentPage === "editor") {
    renderEditor(state);
    return;
  }

  if (currentPage === "recipes") {
    renderRecipes(state);
    return;
  }

  if (currentPage === "shopping") {
    renderShopping(state);
    return;
  }

  if (currentPage === "profile") {
    renderProfile(state);
    return;
  }
}


// ==================================================
// HOME
// ==================================================

function renderHome(state) {
  const cats = store.categories;

  const featuredIds = [
    "soup",
    "noodle",
    "western-dessert",
    "vegetable"
  ];

  const featured = featuredIds
    .map(id =>
      cats.find(item => item.id === id)
    )
    .filter(Boolean);

  const recipeCount =
    recipes().length;

  const favoriteCount =
    recipes().filter(
      item => item.favorite
    ).length;

  const shoppingCount =
    (state.shoppingLists || [])
      .reduce(
        (total, list) =>
          total +
          (list.items || []).length,
        0
      );

  const profile =
    state.profile || {};

  const avatarHTML =
  profile.avatar
    ? `
      <img
        src="${profile.avatar}"
        alt=""
      />
    `
    : `
      <img
        src="./assets/avatar-profile.png"
        alt="My Kitchen Rose"
      />
    `;

  app.innerHTML = `
    <div class="page home-page">

      <!-- TOP HEADER -->
      <header class="home-topbar">

        <button
          class="home-avatar"
          id="home-avatar"
          aria-label="我的"
        >
          ${avatarHTML}
        </button>

        <div class="home-brand">

          <strong>
            My Kitchen Rose
          </strong>

          <small>
            RECIPE JOURNAL
          </small>

        </div>

        <div class="home-tools">

          <button
            class="home-tool"
            id="home-search-button"
            aria-label="搜索"
          >
            ⌕
          </button>

          <button
            class="home-tool"
            id="home-settings"
            aria-label="设置"
          >
            ⚙
          </button>

        </div>

      </header>


      <!-- INTRO -->
      <section class="home-intro">

        <p>
          用喜欢的食物，
        </p>

        <h1>
          过喜欢的生活 ♡
        </h1>

        <span>
          MY LITTLE KITCHEN DIARY
        </span>

      </section>


      <!-- SEARCH -->
      <div class="search-box home-search">

        <span>⌕</span>

        <input
          id="global-search"
          placeholder="搜索食谱 / 食材 / 菜系"
          value="${escapeHTML(
            searchText
          )}"
        />

      </div>


      ${
        searchText.trim()
          ? searchResultHTML()

          : `

            <!-- FEATURED -->
            <section class="featured-strip">

              ${featured
                .map(
                  item => `
                    <button
                      class="featured-card"
                      data-category="${item.id}"
                    >

                      <div class="featured-image">

                        <img
                          src="${item.icon}"
                          alt="${escapeHTML(
                            item.name
                          )}"
                        />

                      </div>

                      <span>
                        ${escapeHTML(
                          item.name
                        )}
                      </span>

                    </button>
                  `
                )
                .join("")}

            </section>


            <!-- STATS -->
            <section class="home-stats">

              <div>
                <strong>
                  ${cats.length}
                </strong>

                <span>
                  分类
                </span>
              </div>


              <div>
                <strong>
                  ${recipeCount}
                </strong>

                <span>
                  食谱
                </span>
              </div>


              <div>
                <strong>
                  ${favoriteCount}
                </strong>

                <span>
                  收藏
                </span>
              </div>


              <div>
                <strong>
                  ${shoppingCount}
                </strong>

                <span>
                  购买清单
                </span>
              </div>

            </section>


            <!-- ALL CATEGORIES -->
            <section
              class="section-block home-category-section"
            >

              <div class="section-title">

                <h2>
                  全部分类
                </h2>

                <span>
                  一起收藏美味的回忆 ♡
                </span>

              </div>


              <div class="category-grid">

                ${cats
                  .map(
                    item => `
                      <button
                        class="category-card"
                        data-category="${item.id}"
                      >

                        <div class="category-image">

                          <img
                            src="${item.icon}"
                            alt="${escapeHTML(
                              item.name
                            )}"
                          />

                        </div>


                        <div
                          class="category-card-text"
                        >

                          <span>
                            ${escapeHTML(
                              item.name
                            )}
                          </span>

                          <small>
                            ${
                              categoryRecipes(
                                item.id
                              ).length
                            } 道食谱
                          </small>

                        </div>

                      </button>
                    `
                  )
                  .join("")}

              </div>


              <button
                class="home-add-button"
                id="home-add-recipe"
              >
                <span>＋</span>
                新增食谱
              </button>

            </section>

          `
      }

    </div>

    ${bottomNav("home")}
  `;


  bindHome();


  const settings =
    $("#home-settings");

  if (settings) {
    settings.onclick =
      () => showPage("profile");
  }


  const avatar =
    $("#home-avatar");

  if (avatar) {
    avatar.onclick =
      () => showPage("profile");
  }


  const searchButton =
    $("#home-search-button");

  if (searchButton) {

    searchButton.onclick =
      () => {

        const input =
          $("#global-search");

        if (input) {

          input.focus();

          input.scrollIntoView({
            behavior: "smooth",
            block: "center"
          });

        }

      };

  }


  const addButton =
    $("#home-add-recipe");

  if (addButton) {

    addButton.onclick =
      () => newRecipe("other");

  }
}

function searchResultHTML() {
  const keyword =
    searchText
      .trim()
      .toLowerCase();

  const result =
    recipes().filter(recipe => {
      const ingredientText =
        (recipe.ingredients || [])
          .map(
            item =>
              `${item.name} ${item.amount}`
          )
          .join(" ");

      return [
        recipe.title,
        recipe.intro,
        recipe.categoryId,
        ingredientText
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });

  return `
    <section class="section-block">

      <div class="section-title">
        <h2>搜索结果</h2>

        <button
          class="text-button"
          id="clear-search"
        >
          清除
        </button>
      </div>

      ${
        result.length
          ? `
            <div class="recipe-list">
              ${result
                .map(
                  recipe =>
                    recipeCardHTML(
                      recipe
                    )
                )
                .join("")}
            </div>
          `
          : `
            <div class="empty-card">
              <div>⌕</div>
              <h3>没有找到食谱</h3>
              <p>
                可以试试其他食材或菜名
              </p>
            </div>
          `
      }

    </section>
  `;
}

function bindHome() {
  $$(
  ".category-card, .featured-card"
).forEach(
    button => {
      button.onclick = () =>
        showCategory(
          button.dataset.category
        );
    }
  );

  const input =
    $("#global-search");

  if (input) {
    input.oninput = event => {
      searchText =
        event.target.value;

      renderHome(
        store.getState()
      );

      const next =
        $("#global-search");

      if (next) {
        next.focus();

        next.setSelectionRange(
          next.value.length,
          next.value.length
        );
      }
    };
  }

  const clear =
    $("#clear-search");

  if (clear) {
    clear.onclick = () => {
      searchText = "";
      render();
    };
  }

  bindRecipeCards();
}


// ==================================================
// CATEGORY
// ==================================================

function renderCategory(state) {
  const item =
    category(currentCategory);

  if (!item) {
    showPage("home");
    return;
  }

  const list =
    categoryRecipes(
      currentCategory
    );

  app.innerHTML = `
    <div class="page category-page">

      <button
        class="back-button"
        id="back-home"
      >
        ← 首页
      </button>

      <section class="category-header">

        <div class="large-category-icon">
          <img src="${item.icon}" />
        </div>

        <div>
          <p>我的厨房分类</p>
          <h1>
            ${escapeHTML(item.name)}
          </h1>
          <span>
            ${list.length} 道食谱
          </span>
        </div>

      </section>

      <button
        class="primary-button add-recipe-button"
        id="add-recipe"
      >
        ＋ 添加新食谱
      </button>

      ${
        list.length
          ? `
            <div class="recipe-list">
              ${list
                .map(
                  recipe =>
                    recipeCardHTML(
                      recipe
                    )
                )
                .join("")}
            </div>
          `
          : `
            <div class="empty-card empty-category">

              <div class="empty-icon">
                ${item.name === "鸡肉"
                  ? "🐔"
                  : "♡"}
              </div>

              <h3>
                还没有食谱
              </h3>

              <p>
                把你的第一道料理记录下来吧
              </p>

              <button
                class="primary-button"
                id="empty-add"
              >
                ＋ 添加第一道食谱
              </button>

            </div>
          `
      }

    </div>

    ${bottomNav()}
  `;

  $("#back-home").onclick =
    () => showPage("home");

  $("#add-recipe").onclick =
    () =>
      newRecipe(
        currentCategory
      );

  const empty =
    $("#empty-add");

  if (empty) {
    empty.onclick = () =>
      newRecipe(
        currentCategory
      );
  }

  bindRecipeCards();
}


// ==================================================
// RECIPE CARD
// ==================================================

function recipeCardHTML(recipe) {
  const cat =
    category(recipe.categoryId);

  const cover =
    recipe.cover ||
    recipe.photos?.[0] ||
    iconForCategory(
      recipe.categoryId
    );

  return `
    <article
      class="recipe-card"
      data-recipe="${recipe.id}"
    >

      <div class="recipe-cover">
        <img
          src="${cover}"
          alt=""
        />
      </div>

      <div class="recipe-card-content">

        <div class="recipe-category">
          ${escapeHTML(
            cat?.name || "其他"
          )}
        </div>

        <h3>
          ${escapeHTML(
            recipe.title ||
            "未命名食谱"
          )}
        </h3>

        <p>
          ${escapeHTML(
            recipe.intro ||
            "还没有写介绍 ♡"
          )}
        </p>

        <div class="recipe-meta">
          ${
            recipe.time
              ? `⏱ ${escapeHTML(
                  recipe.time
                )}`
              : ""
          }

          ${
            recipe.servings
              ? ` · ${escapeHTML(
                  recipe.servings
                )}`
              : ""
          }
        </div>

      </div>

      <button
        class="favorite-button ${
          recipe.favorite
            ? "active"
            : ""
        }"
        data-favorite="${recipe.id}"
      >
        ${recipe.favorite ? "♥" : "♡"}
      </button>

    </article>
  `;
}

function bindRecipeCards() {
  $$("[data-recipe]").forEach(
    card => {
      card.onclick = event => {
        if (
          event.target.closest(
            "[data-favorite]"
          )
        ) {
          return;
        }

        const recipe =
          recipes().find(
            item =>
              item.id ===
              card.dataset.recipe
          );

        if (recipe) {
          editRecipe(recipe);
        }
      };
    }
  );

  $$("[data-favorite]").forEach(
    button => {
      button.onclick = async event => {
        event.stopPropagation();

        await store.toggleFavorite(
          button.dataset.favorite
        );
      };
    }
  );
}


// ==================================================
// RECIPE EDITOR
// ==================================================

function renderEditor(state) {
  const recipe =
    editingRecipe;

  const cat =
    category(
      recipe.categoryId
    );

  app.innerHTML = `
    <div class="page editor-page">

      <button
        class="back-button"
        id="back-category"
      >
        ← ${escapeHTML(
          cat?.name || "分类"
        )}
      </button>

      <section class="editor-heading">

        <div class="mini-category-icon">
          <img src="${cat?.icon || iconForCategory("other")}" />
        </div>

        <div>
          <p>记录今天的美味</p>
          <h1>
            ${recipe.id
              ? "编辑食谱"
              : "添加新食谱"}
          </h1>
        </div>

      </section>

      <section class="form-card">

        <div class="form-title">
          <span>01</span>
          <h2>基本资料</h2>
        </div>

        <label>
          菜名
          <input
            id="recipe-title"
            value="${escapeHTML(
              recipe.title
            )}"
            placeholder="例如：奶油蘑菇鸡"
          />
        </label>

        <label>
          介绍
          <textarea
            id="recipe-intro"
            placeholder="写一点关于这道菜的小故事 ♡"
          >${escapeHTML(
            recipe.intro
          )}</textarea>
        </label>

        <div class="two-column">

          <label>
            份量
            <input
              id="recipe-servings"
              value="${escapeHTML(
                recipe.servings
              )}"
              placeholder="2 人份"
            />
          </label>

          <label>
            时间
            <input
              id="recipe-time"
              value="${escapeHTML(
                recipe.time
              )}"
              placeholder="30 分钟"
            />
          </label>

        </div>

      </section>


      <section class="form-card">

        <div class="form-title">
          <span>02</span>
          <h2>食材</h2>
        </div>

        <div id="ingredients">
          ${(recipe.ingredients || [])
            .map(
              (item, index) =>
                ingredientHTML(
                  item,
                  index
                )
            )
            .join("")}
        </div>

        <button
          class="outline-button"
          id="add-ingredient"
        >
          ＋ 添加食材
        </button>

      </section>


      <section class="form-card">

        <div class="form-title">
          <span>03</span>
          <h2>烹饪步骤</h2>
        </div>

        <div id="steps">
          ${(recipe.steps || [])
            .map(
              (step, index) =>
                stepHTML(
                  step,
                  index
                )
            )
            .join("")}
        </div>

        <button
          class="outline-button"
          id="add-step"
        >
          ＋ 添加步骤
        </button>

      </section>


      <section class="form-card">

        <div class="form-title">
          <span>04</span>
          <h2>照片</h2>
        </div>

        <p class="form-hint">
          可以添加主题照片和制作过程照片
        </p>

        <label class="photo-upload">

          <span>＋</span>

          <strong>
            添加照片
          </strong>

          <small>
            照片会保存在本机
          </small>

          <input
            id="recipe-photos"
            type="file"
            accept="image/*"
            multiple
          />

        </label>

        <div
          class="photo-preview"
          id="photo-preview"
        >
          ${(recipe.photos || [])
            .map(
              photo => `
                <img
                  src="${photo}"
                  alt=""
                />
              `
            )
            .join("")}
        </div>

      </section>


      <section class="editor-actions">

        <button
          class="small-action"
          id="print-recipe"
        >
          🖨 Print
        </button>

        <button
          class="small-action"
          id="share-recipe"
        >
          ↗ 分享
        </button>

        <button
          class="save-button"
          id="save-recipe"
        >
          ♥ 保存
        </button>

      </section>

    </div>

    ${bottomNav()}
  `;

  $("#back-category").onclick =
    () =>
      showCategory(
        recipe.categoryId
      );

  $("#add-ingredient").onclick =
    () => {
      recipe.ingredients.push({
        name: "",
        amount: ""
      });

      renderEditor(
        store.getState()
      );
    };

  $("#add-step").onclick =
    () => {
      recipe.steps.push({
        text: ""
      });

      renderEditor(
        store.getState()
      );
    };

  bindEditorInputs();

  $("#recipe-photos").onchange =
    async event => {
      const files =
        [...event.target.files];

      for (const file of files) {
        const data =
          await fileToDataURL(
            file
          );

        recipe.photos.push(
          data
        );

        if (!recipe.cover) {
          recipe.cover = data;
        }
      }

      renderEditor(
        store.getState()
      );
    };

  $("#save-recipe").onclick =
    saveCurrentRecipe;

  $("#print-recipe").onclick =
    () =>
      printRecipe(
        collectRecipeForm()
      );

  $("#share-recipe").onclick =
    () =>
      shareRecipe(
        collectRecipeForm()
      );
}

function ingredientHTML(
  item,
  index
) {
  return `
    <div class="ingredient-row">

      <span class="row-number">
        ${index + 1}
      </span>

      <input
        data-ingredient-name="${index}"
        value="${escapeHTML(
          item.name
        )}"
        placeholder="食材名称"
      />

      <input
        data-ingredient-amount="${index}"
        value="${escapeHTML(
          item.amount
        )}"
        placeholder="用量"
      />

      <button
        data-remove-ingredient="${index}"
        type="button"
      >
        ×
      </button>

    </div>
  `;
}

function stepHTML(
  step,
  index
) {
  return `
    <div class="step-row">

      <span class="step-number">
        ${index + 1}
      </span>

      <textarea
        data-step="${index}"
        placeholder="写下第 ${index + 1} 个步骤..."
      >${escapeHTML(
        step.text
      )}</textarea>

      <button
        data-remove-step="${index}"
        type="button"
      >
        ×
      </button>

    </div>
  `;
}

function bindEditorInputs() {
  $("#recipe-title").oninput =
    event => {
      editingRecipe.title =
        event.target.value;
    };

  $("#recipe-intro").oninput =
    event => {
      editingRecipe.intro =
        event.target.value;
    };

  $("#recipe-servings").oninput =
    event => {
      editingRecipe.servings =
        event.target.value;
    };

  $("#recipe-time").oninput =
    event => {
      editingRecipe.time =
        event.target.value;
    };

  $$(
    "[data-ingredient-name]"
  ).forEach(input => {
    input.oninput =
      event => {
        const index =
          Number(
            input.dataset
              .ingredientName
          );

        editingRecipe.ingredients[
          index
        ].name =
          event.target.value;
      };
  });

  $$(
    "[data-ingredient-amount]"
  ).forEach(input => {
    input.oninput =
      event => {
        const index =
          Number(
            input.dataset
              .ingredientAmount
          );

        editingRecipe.ingredients[
          index
        ].amount =
          event.target.value;
      };
  });

  $$(
    "[data-step]"
  ).forEach(input => {
    input.oninput =
      event => {
        const index =
          Number(
            input.dataset.step
          );

        editingRecipe.steps[
          index
        ].text =
          event.target.value;
      };
  });

  $$(
    "[data-remove-ingredient]"
  ).forEach(button => {
    button.onclick = () => {
      const index =
        Number(
          button.dataset
            .removeIngredient
        );

      editingRecipe.ingredients.splice(
        index,
        1
      );

      if (
        editingRecipe.ingredients
          .length === 0
      ) {
        editingRecipe.ingredients.push({
          name: "",
          amount: ""
        });
      }

      renderEditor(
        store.getState()
      );
    };
  });

  $$(
    "[data-remove-step]"
  ).forEach(button => {
    button.onclick = () => {
      const index =
        Number(
          button.dataset
            .removeStep
        );

      editingRecipe.steps.splice(
        index,
        1
      );

      if (
        editingRecipe.steps.length ===
        0
      ) {
        editingRecipe.steps.push({
          text: ""
        });
      }

      renderEditor(
        store.getState()
      );
    };
  });
}

function collectRecipeForm() {
  return {
    ...editingRecipe,

    title:
      $("#recipe-title")?.value ||
      editingRecipe.title,

    intro:
      $("#recipe-intro")?.value ||
      editingRecipe.intro,

    servings:
      $("#recipe-servings")?.value ||
      editingRecipe.servings,

    time:
      $("#recipe-time")?.value ||
      editingRecipe.time
  };
}

async function saveCurrentRecipe() {
  const recipe =
    collectRecipeForm();

  if (!recipe.title.trim()) {
    alert("请先填写菜名 ♡");
    return;
  }

  await store.upsertRecipe(
    recipe
  );

  alert("食谱已经保存好了 ♡");

  showCategory(
    recipe.categoryId
  );
}


// ==================================================
// RECIPES PAGE
// ==================================================

function renderRecipes(state) {
  const all =
    recipes();

  const favorites =
    all.filter(
      item => item.favorite
    );

  app.innerHTML = `
    <div class="page recipes-page">

      <section class="page-heading">
        <p>My Kitchen Rose</p>
        <h1>食谱大全</h1>
        <span>
          收藏每一道属于你的味道 ♡
        </span>
      </section>

      <div class="recipe-tabs">
        <button
          class="recipe-tab active"
          data-tab="all"
        >
          全部食谱
        </button>

        <button
          class="recipe-tab"
          data-tab="favorite"
        >
          ♥ 已收藏
        </button>
      </div>

      <div
        id="recipe-tab-content"
        class="recipe-list"
      >
        ${all
          .map(
            recipe =>
              recipeCardHTML(
                recipe
              )
          )
          .join("")}
      </div>

    </div>

    ${bottomNav("recipes")}
  `;

  $$(
    ".recipe-tab"
  ).forEach(button => {
    button.onclick = () => {
      $$(".recipe-tab").forEach(
        item =>
          item.classList.remove(
            "active"
          )
      );

      button.classList.add(
        "active"
      );

      const list =
        button.dataset.tab ===
        "favorite"
          ? favorites
          : all;

      $("#recipe-tab-content")
        .innerHTML = list.length
        ? list
            .map(
              recipe =>
                recipeCardHTML(
                  recipe
                )
            )
            .join("")
          : `
              <div class="empty-card">
                <div>♡</div>
                <h3>
                  还没有收藏
                </h3>
                <p>
                  喜欢的食谱可以收藏起来
                </p>
              </div>
            `;

      bindRecipeCards();
    };
  });

  bindRecipeCards();
}


// ==================================================
// SHOPPING
// ==================================================

function renderShopping(state) {
  const lists =
    state.shoppingLists || [];

  app.innerHTML = `
    <div class="page shopping-page">

      <section class="page-heading">
        <p>Little Shopping List</p>
        <h1>购买清单</h1>
        <span>
          把今天要买的东西记下来 ♡
        </span>
      </section>

      ${
        lists.length
          ? `
            <div class="shopping-lists">
              ${lists
                .map(
                  list =>
                    shoppingListHTML(
                      list
                    )
                )
                .join("")}
            </div>
          `
          : `
            <div class="empty-card shopping-empty">
              <div>🛒</div>
              <h3>清单是空的</h3>
              <p>
                今天想买什么呢？
              </p>
            </div>
          `
      }

      <button
        class="primary-button"
        id="add-shopping"
      >
        ＋ 添加清单
      </button>

    </div>

    ${bottomNav("shopping")}
  `;

  $("#add-shopping").onclick =
    openShoppingModal;

  bindShopping();
}

function shoppingListHTML(list) {
  return `
    <article
      class="shopping-card"
      data-shopping="${list.id}"
    >

      <div class="shopping-card-header">

        <div>
          <span>今天要买什么？</span>
          <h3>
            ${escapeHTML(
              list.title ||
              "购物清单"
            )}
          </h3>
        </div>

        <button
          data-delete-shopping="${list.id}"
        >
          ×
        </button>

      </div>

      <div class="shopping-items">

        ${(list.items || [])
          .map(
            (item, index) => `
              <label
                class="shopping-item ${
                  item.completed
                    ? "completed"
                    : ""
                }"
              >

                <input
                  type="checkbox"
                  data-check-shopping="${list.id}"
                  data-item-index="${index}"
                  ${
                    item.completed
                      ? "checked"
                      : ""
                  }
                />

                <span>
                  ${escapeHTML(
                    item.name
                  )}
                </span>

                <small>
                  ${escapeHTML(
                    item.quantity ||
                    ""
                  )}
                </small>

              </label>
            `
          )
          .join("")}

      </div>

    </article>
  `;
}

function bindShopping() {
  $$(
    "[data-delete-shopping]"
  ).forEach(button => {
    button.onclick = async () => {
      await store.deleteShoppingList(
        button.dataset
          .deleteShopping
      );
    };
  });

  $$(
    "[data-check-shopping]"
  ).forEach(input => {
    input.onchange = async () => {
      const id =
        input.dataset
          .checkShopping;

      const index =
        Number(
          input.dataset
            .itemIndex
        );

      const list =
        store
          .getState()
          .shoppingLists.find(
            item =>
              item.id === id
          );

      if (!list) return;

      const items =
        structuredClone(
          list.items || []
        );

      items[index].completed =
        input.checked;

      await store.updateShoppingList(
        id,
        { items }
      );
    };
  });
}

function openShoppingModal() {
  const modal =
    document.createElement(
      "div"
    );

  modal.className =
    "modal-backdrop";

  modal.innerHTML = `
    <div class="bottom-sheet">

      <button
        class="sheet-close"
        id="close-sheet"
      >
        ×
      </button>

      <p>Shopping List</p>

      <h2>
        今天要买什么？
      </h2>

      <div id="shopping-inputs">

        <div class="shopping-input-row">
          <input
            placeholder="食材"
            class="shop-name"
          />

          <input
            placeholder="数量"
            class="shop-amount"
          />
        </div>

      </div>

      <button
        class="outline-button"
        id="add-shop-row"
      >
        ＋ 添加食材
      </button>

      <button
        class="primary-button"
        id="save-shopping"
      >
        保存清单
      </button>

    </div>
  `;

  document.body.appendChild(
    modal
  );

  $("#close-sheet").onclick =
    () => modal.remove();

  $("#add-shop-row").onclick =
    () => {
      $("#shopping-inputs")
        .insertAdjacentHTML(
          "beforeend",
          `
            <div class="shopping-input-row">
              <input
                placeholder="食材"
                class="shop-name"
              />

              <input
                placeholder="数量"
                class="shop-amount"
              />
            </div>
          `
        );
    };

  $("#save-shopping").onclick =
    async () => {
      const names =
        $$(".shop-name", modal);

      const amounts =
        $$(".shop-amount", modal);

      const items =
        names
          .map(
            (input, index) => ({
              id:
                Date.now() +
                "-" +
                index,

              name:
                input.value.trim(),

              quantity:
                amounts[index]
                  ?.value
                  .trim() || "",

              completed: false
            })
          )
          .filter(
            item =>
              item.name
          );

      if (!items.length) {
        alert("请至少填写一样食材");
        return;
      }

      await store.addShoppingList({
        title:
          "今天要买什么？",

        items
      });

      modal.remove();
    };
}


// ==================================================
// PROFILE
// ==================================================

function renderProfile(state) {
  const profile = state.profile || {};

  const recipeCount = recipes().length;

  const favoriteCount =
    recipes().filter(
      item => item.favorite
    ).length;

  const shoppingCount =
    (state.shoppingLists || []).reduce(
      (total, list) =>
        total + (list.items || []).length,
      0
    );

  const categoryCount =
    store.categories.length;

  const avatarHTML =
    profile.avatar
      ? `
        <img
          src="${profile.avatar}"
          alt="My Kitchen Rose"
        />
      `
      : `
        <img
          src="./assets/avatar-profile.png"
          alt="My Kitchen Rose"
        />
      `;

  app.innerHTML = `
    <div class="page profile-page">

      <!-- =====================================
           PROFILE HERO
      ====================================== -->

      <section class="profile-hero">

        <div class="profile-topbar">

          <div class="profile-avatar-wrap">
            <div class="profile-avatar">
              ${avatarHTML}
            </div>
          </div>

          <div class="profile-title">

            <h1>我的</h1>

            <span>
              MY PROFILE
            </span>

            <div class="profile-title-line">
              <i></i>
              <b>♡</b>
              <i></i>
            </div>

          </div>

          <div class="profile-tools">

            <button
              class="profile-tool"
              id="profile-search"
              aria-label="搜索"
            >
              ⌕
            </button>

            <button
              class="profile-tool"
              id="profile-settings"
              aria-label="设置"
            >
              ⚙
            </button>

          </div>

        </div>


        <div class="profile-intro">

          <p>
            记录生活，
          </p>

          <strong>
            也记录更好的自己 ♡
          </strong>

        </div>

      </section>


      <!-- =====================================
           FOUR STATISTICS
      ====================================== -->

      <section class="profile-stats profile-stats-four">

        <div class="profile-stat">

          <div class="profile-stat-icon">
            📖
          </div>

          <strong>
            ${categoryCount}
          </strong>

          <span>
            分类
          </span>

        </div>


        <div class="profile-stat">

          <div class="profile-stat-icon">
            📝
          </div>

          <strong>
            ${recipeCount}
          </strong>

          <span>
            食谱
          </span>

        </div>


        <div class="profile-stat">

          <div class="profile-stat-icon">
            ♡
          </div>

          <strong>
            ${favoriteCount}
          </strong>

          <span>
            收藏
          </span>

        </div>


        <div class="profile-stat">

          <div class="profile-stat-icon">
            🛒
          </div>

          <strong>
            ${shoppingCount}
          </strong>

          <span>
            购买清单
          </span>

        </div>

      </section>


      <!-- =====================================
           RECIPE OVERVIEW
      ====================================== -->

      <section class="profile-recipe-card profile-recipe-image-card">
  <img
    src="./assets/profile-recipe-card.jpg"
    alt="芳芳的小厨房日记"
  />
</section>


      <!-- =====================================
           BACKUP
      ====================================== -->

      <section class="profile-backup-card">

        <div class="profile-backup-text">

          <h2>
            🛡️ 数据备份
          </h2>

          <p>
            本地自动保存已开启。建议定期手动备份，
            防止误清除 Safari 数据导致食谱丢失。
          </p>

        </div>


        <div class="profile-backup-actions">

          <button
            class="backup-icon-button"
            id="backup-data"
            aria-label="备份食谱"
          >
            ⬇️
          </button>


          <label
            class="backup-restore-button"
          >

            <span>
              ⬆️
            </span>

            <strong>
              导入恢复
            </strong>

            <input
              id="restore-file"
              type="file"
              accept=".json,application/json"
              hidden
            />

          </label>

        </div>

      </section>


      <!-- =====================================
           ABOUT
      ====================================== -->

      <section class="profile-about-card">

        <div class="profile-about-icon">
          🌿
        </div>

        <div class="profile-about-text">

          <h2>
            关于
          </h2>

          <p>
            芳芳的厨房日记 · 记录每一道治愈的味道
          </p>

        </div>

        <div class="profile-about-art">
          💌
        </div>

      </section>


      <!-- =====================================
           LITTLE QUOTE
      ====================================== -->

      <div class="profile-quote">
        ♡ 珍藏生活里的小美好 ♡
      </div>


      <!-- =====================================
           LOCAL SAVE
      ====================================== -->

      <section class="profile-local-save">

        <strong>
          本地自动保存 ♡
        </strong>

        <p>
          食谱会自动保存在这台设备的浏览器中。
          建议定期使用「数据备份」保存一份副本。
        </p>

      </section>

    </div>

    ${bottomNav("profile")}
  `;


  /* =====================================
     BACKUP
  ====================================== */

  $("#backup-data").onclick =
    () => store.exportBackup();


  /* =====================================
     RESTORE
  ====================================== */

  $("#restore-file").onchange =
    async event => {

      const file =
        event.target.files?.[0];

      if (!file) return;

      try {

        await store.importBackup(file);

        alert(
          "备份恢复成功 ♡"
        );

      } catch {

        alert(
          "备份文件无法读取"
        );

      }

    };


  /* =====================================
     PROFILE SEARCH
  ====================================== */

  $("#profile-search").onclick =
    () => {

      currentPage = "home";

      render();

      setTimeout(() => {
        $("#global-search")?.focus();
      }, 100);

    };


  /* =====================================
     PROFILE SETTINGS
  ====================================== */

  $("#profile-settings").onclick =
    () =>
      openProfileModal(profile);

}

function openProfileModal(
  profile
) {
  const modal =
    document.createElement(
      "div"
    );

  modal.className =
    "modal-backdrop";

  modal.innerHTML = `
    <div class="bottom-sheet">

      <button
        class="sheet-close"
        id="close-profile"
      >
        ×
      </button>

      <p>My Profile</p>

      <h2>
        主厨资料
      </h2>

      <label>
        名字
        <input
          id="profile-name"
          value="${escapeHTML(
            profile.name ||
            ""
          )}"
        />
      </label>

      <label>
        介绍
        <textarea
          id="profile-bio"
        >${escapeHTML(
          profile.bio ||
          ""
        )}</textarea>
      </label>

      <button
        class="primary-button"
        id="save-profile"
      >
        保存资料
      </button>

    </div>
  `;

  document.body.appendChild(
    modal
  );

  $("#close-profile").onclick =
    () => modal.remove();

  $("#save-profile").onclick =
    async () => {
      await store.updateProfile({
        name:
          $("#profile-name")
            .value,

        bio:
          $("#profile-bio")
            .value
      });

      modal.remove();
    };
}


// ==================================================
// BOTTOM NAV
// ==================================================

function bottomNav(active = "") {
  return `
    <nav class="bottom-nav">

      <button
        class="${
          active === "home"
            ? "active"
            : ""
        }"
        data-nav="home"
      >
        <span>⌂</span>
        <small>首页</small>
      </button>

      <button
        class="${
          active === "recipes"
            ? "active"
            : ""
        }"
        data-nav="recipes"
      >
        <span>▧</span>
        <small>食谱</small>
      </button>

      <button
        class="${
          active === "shopping"
            ? "active"
            : ""
        }"
        data-nav="shopping"
      >
        <span>🛒</span>
        <small>购买清单</small>
      </button>

      <button
        class="${
          active === "profile"
            ? "active"
            : ""
        }"
        data-nav="profile"
      >
        <span>♡</span>
        <small>我的</small>
      </button>

    </nav>
  `;
}


// ==================================================
// PRINT
// ==================================================

function printRecipe(recipe) {

  const cat =
    category(recipe.categoryId);


  // ==================================================
  // PHOTOS
  // ==================================================

  const photos =
    recipe.photos || [];


  const coverPhoto =
    recipe.cover ||
    photos[0] ||
    "";


  const coverIndex =
    coverPhoto
      ? photos.findIndex(
          photo =>
            photo === coverPhoto
        )
      : -1;


  // 封面不再重复出现在制作记录
  const galleryPhotos =
    coverIndex >= 0
      ? photos.filter(
          (_, index) =>
            index !== coverIndex
        )
      : photos;


  // ==================================================
  // OPEN PRINT WINDOW
  // ==================================================

  const printWindow =
    window.open(
      "",
      "_blank"
    );


  if (!printWindow) {

    alert(
      "请允许浏览器打开打印页面"
    );

    return;
  }


  // ==================================================
  // IMPORTANT PATHS
  // ==================================================

  const baseURL =
    window.location.href;


  const backgroundURL =
    new URL(
      "./assets/app-background.jpg",
      baseURL
    ).href;


  const fontURL =
    new URL(
      "./assets/fonts/泥木扭扭体NeedMood NiuNiu.ttf",
      baseURL
    ).href;


  // ==================================================
  // ESCAPED CONTENT
  // ==================================================

  const safeTitle =
    escapeHTML(
      recipe.title ||
      "我的食谱"
    );


  const safeCategory =
    escapeHTML(
      cat?.name ||
      ""
    );


  const safeIntro =
    escapeHTML(
      recipe.intro ||
      ""
    );


  const safeServings =
    escapeHTML(
      recipe.servings ||
      "—"
    );


  const safeTime =
    escapeHTML(
      recipe.time ||
      "—"
    );


  // ==================================================
  // INGREDIENTS
  // ==================================================

  const ingredientsHTML =
    (recipe.ingredients || [])
      .map(
        item => `
          <li>

            ${escapeHTML(
              item.name ||
              ""
            )}

            ${
              item.amount
                ? `
                  — ${escapeHTML(
                    item.amount
                  )}
                `
                : ""
            }

          </li>
        `
      )
      .join("");


  // ==================================================
  // STEPS
  //
  // 每一个步骤都是独立 block。
  // 内容太多时可以自然进入下一页。
  // ==================================================

  const stepsHTML =
    (recipe.steps || [])
      .map(
        (step, index) => `
          <div
            class="step-item print-block"
          >

            <span class="step-index">
              ${index + 1}
            </span>

            <div class="step-text">

              ${escapeHTML(
                step.text ||
                ""
              )}

            </div>

          </div>
        `
      )
      .join("");


  // ==================================================
  // PHOTO ROWS
  //
  // 两张照片为一组。
  //
  // 这样：
  //
  // ❌ 不会出现左边照片在第一页、
  //    右边照片被挤到第二页
  //
  // ❌ 不会切一半
  //
  // ✅ 整行一起移动
  // ==================================================

  const photoRows = [];


  for (
    let i = 0;
    i < galleryPhotos.length;
    i += 2
  ) {

    const first =
      galleryPhotos[i];


    const second =
      galleryPhotos[i + 1];


    photoRows.push(`

      <div
        class="photo-row print-block"
      >

        <div class="photo-box">

          <img
            src="${first}"
            alt=""
          >

        </div>


        ${
          second
            ? `
              <div class="photo-box">

                <img
                  src="${second}"
                  alt=""
                >

              </div>
            `
            : `
              <div
                class="photo-box photo-empty"
              ></div>
            `
        }

      </div>

    `);

  }


  // ==================================================
  // WRITE PRINT DOCUMENT
  // ==================================================

  printWindow.document.write(`

<!doctype html>

<html lang="zh-CN">


<head>

<meta charset="UTF-8">


<meta
  name="viewport"
  content="
    width=device-width,
    initial-scale=1
  "
>


<title>
  ${safeTitle}
</title>


<style>

/* =====================================================
   FONT
===================================================== */

@font-face {

  font-family:
    "NeedMoodNiuNiu";

  src:
    url("${fontURL}")
    format("truetype");

  font-style:
    normal;

  font-weight:
    100 900;

  font-display:
    block;

}


html,
body,
* {

  font-family:
    "NeedMoodNiuNiu",
    sans-serif !important;

}


/* =====================================================
   A4
===================================================== */

@page {

  size:
    A4;

  margin:
    0;

}


/* =====================================================
   RESET
===================================================== */

* {

  box-sizing:
    border-box;

}


html,
body {

  margin:
    0;

  padding:
    0;

  background:
    #dcecef;

  color:
    #536b71;

  -webkit-print-color-adjust:
    exact !important;

  print-color-adjust:
    exact !important;

}


/* =====================================================
   PRINT DOCUMENT
===================================================== */

#print-root {

  width:
    100%;

}


/* =====================================================
   EVERY A4 PAGE
===================================================== */

.print-page {

  position:
    relative;

  width:
    210mm;

  height:
    296.5mm;

  min-height:
    296.5mm;

  max-height:
    296.5mm;

  padding:
    7mm;

  overflow:
    hidden;

  break-after:
    page;

  page-break-after:
    always;

}


/* 最后一页不要强制再产生一页 */

.print-page:last-child {

  break-after:
    auto;

  page-break-after:
    auto;

}


/* =====================================================
   BACKGROUND
   每一页都有自己的完整水彩背景
===================================================== */

.page-background {

  position:
    absolute;

  inset:
    0;

  width:
    100%;

  height:
    100%;

  object-fit:
    cover;

  object-position:
    center top;

  opacity:
    .72;

  z-index:
    0;

}


/* =====================================================
   WHITE CONTENT CARD
===================================================== */

.content-card {

  position:
    relative;

  z-index:
    2;

  width:
    100%;

  min-height:
    282mm;

  padding:
    8mm;

  border-radius:
    30px;

  background:
    rgba(
      255,
      255,
      255,
      .88
    );

  border:
    1px solid
    rgba(
      255,
      255,
      255,
      .94
    );

  box-shadow:
    0 8px 28px
    rgba(
      80,
      110,
      115,
      .10
    );

}


/* =====================================================
   PAGE HEADER
===================================================== */

.page-heading {

  text-align:
    center;

  color:
    #b99b82;

  font-size:
    11px;

  letter-spacing:
    4px;

  margin-bottom:
    5mm;

}


.page-heading::before {

  content:
    "♡";

  display:
    block;

  color:
    #d9a7aa;

  font-size:
    20px;

  margin-bottom:
    2mm;

}


/* =====================================================
   CATEGORY
===================================================== */

.category {

  text-align:
    center;

  color:
    #91a9ad;

  font-size:
    14px;

  margin-bottom:
    3mm;

}


/* =====================================================
   TITLE
===================================================== */

h1 {

  margin:
    0 0 5mm;

  text-align:
    center;

  color:
    #8b7355;

  font-size:
    30px;

  line-height:
    1.35;

  font-weight:
    600;

}


/* =====================================================
   INTRO
===================================================== */

.intro {

  text-align:
    center;

  color:
    #71878b;

  font-size:
    14px;

  line-height:
    1.7;

  margin-bottom:
    5mm;

}


/* =====================================================
   COVER
===================================================== */

.cover-wrap {

  width:
    100%;

  text-align:
    center;

  margin-bottom:
    5mm;

  break-inside:
    avoid;

  page-break-inside:
    avoid;

}


.cover {

  display:
    block;

  width:
    100%;

  max-height:
    43mm;

  object-fit:
    contain;

  object-position:
    center;

  border-radius:
    18px;

}


/* =====================================================
   INFO
===================================================== */

.info-grid {

  display:
    grid;

  grid-template-columns:
    1fr 1fr;

  gap:
    6mm;

  margin-top:
    3mm;

  break-inside:
    avoid;

  page-break-inside:
    avoid;

}


.info-box {

  min-width:
    0;

}


h2 {

  margin:
    0 0 3mm;

  padding-bottom:
    2.5mm;

  color:
    #7c979b;

  font-size:
    18px;

  font-weight:
    600;

  border-bottom:
    1px solid
    rgba(
      125,
      157,
      162,
      .35
    );

}


ul {

  margin:
    2mm 0 0 5mm;

  padding-left:
    5mm;

}


li {

  margin:
    1.8mm 0;

  font-size:
    14px;

  line-height:
    1.45;

}


.info-box p {

  margin:
    2mm 0;

  font-size:
    14px;

  line-height:
    1.6;

}


/* =====================================================
   STEPS
===================================================== */

.steps-section {

  margin-top:
    4mm;

}


.step-item {

  display:
    flex;

  gap:
    3mm;

  align-items:
    flex-start;

  margin:
    2.5mm 0;

  break-inside:
    avoid;

  page-break-inside:
    avoid;

}


.step-index {

  flex:
    0 0 auto;

  width:
    7mm;

  height:
    7mm;

  display:
    flex;

  align-items:
    center;

  justify-content:
    center;

  border-radius:
    50%;

  background:
    rgba(
      220,
      236,
      239,
      .75
    );

  color:
    #7c979b;

  font-size:
    12px;

}


.step-text {

  flex:
    1;

  font-size:
    14px;

  line-height:
    1.55;

}


/* =====================================================
   PHOTO SECTION
===================================================== */

.photo-section {

  margin-top:
    4mm;

}


.photo-row {

  display:
    grid;

  grid-template-columns:
    1fr 1fr;

  gap:
    4mm;

  margin-top:
    4mm;

  break-inside:
    avoid !important;

  page-break-inside:
    avoid !important;

}


.photo-box {

  width:
    100%;

  height:
    48mm;

  display:
    flex;

  align-items:
    center;

  justify-content:
    center;

  overflow:
    hidden;

  border-radius:
    14px;

  background:
    rgba(
      236,
      244,
      244,
      .48
    );

  break-inside:
    avoid !important;

  page-break-inside:
    avoid !important;

}


.photo-box img {

  display:
    block;

  width:
    100%;

  height:
    100%;

  object-fit:
    contain;

  object-position:
    center;

  border-radius:
    14px;

  break-inside:
    avoid !important;

  page-break-inside:
    avoid !important;

}


.photo-empty {

  visibility:
    hidden;

}


/* =====================================================
   FOOTER
===================================================== */

.footer {

  margin-top:
    5mm;

  padding-top:
    2mm;

  text-align:
    center;

  color:
    #b49b7a;

  font-size:
    11px;

  letter-spacing:
    1px;

}


/* =====================================================
   PRINT
===================================================== */

@media print {

  html,
  body {

    width:
      210mm;

    background:
      #dcecef !important;

    -webkit-print-color-adjust:
      exact !important;

    print-color-adjust:
      exact !important;

  }


  .print-page {

    width:
      210mm;

    height:
      296.5mm;

    min-height:
      296.5mm;

    max-height:
      296.5mm;

    overflow:
      hidden;

  }

}


/* =====================================================
   SCREEN PREVIEW
===================================================== */

@media screen {

  body {

    background:
      #dcecef;

  }

  .print-page {

    margin:
      10px auto;

    box-shadow:
      0 5px 30px
      rgba(
        0,
        0,
        0,
        .12
      );

  }

}

</style>

</head>


<body>


<div id="print-root">


  <!-- =================================================
       FIRST PAGE
       JS 会自动把内容分页
  ================================================== -->

  <section class="print-page">


    <img
      class="page-background"
      src="${backgroundURL}"
      alt=""
    >


    <div class="content-card">


      <div class="page-heading">

        MY LITTLE KITCHEN

      </div>


      <div class="category">

        ${safeCategory}

      </div>


      <h1>

        ${safeTitle}

      </h1>


      ${
        safeIntro
          ? `
            <div class="intro">

              ${safeIntro}

            </div>
          `
          : ""
      }


      ${
        coverPhoto
          ? `
            <div
              class="cover-wrap print-block"
            >

              <img
                class="cover"
                src="${coverPhoto}"
                alt=""
              >

            </div>
          `
          : ""
      }


      <div
        class="info-grid print-block"
      >


        <section
          class="info-box"
        >

          <h2>
            食材
          </h2>

          <ul>

            ${ingredientsHTML}

          </ul>

        </section>


        <section
          class="info-box"
        >

          <h2>
            份量 / 时间
          </h2>

          <p>

            份量：
            ${safeServings}

          </p>

          <p>

            时间：
            ${safeTime}

          </p>

        </section>


      </div>


      ${
        stepsHTML
          ? `
            <section
              class="steps-section"
            >

              <h2>
                烹饪步骤
              </h2>

              <div
                id="steps-container"
              >

                ${stepsHTML}

              </div>

            </section>
          `
          : ""
      }


      ${
        photoRows.length
          ? `
            <section
              class="photo-section"
            >

              <h2>
                制作记录
              </h2>

              <div
                id="photos-container"
              >

                ${photoRows.join("")}

              </div>

            </section>
          `
          : ""
      }


      <div class="footer">

        芳芳的小厨房日记

      </div>


    </div>

  </section>

</div>


<script>

/* =====================================================
   SMART PAGINATION
===================================================== */

async function preparePrint() {

  /*
   * 等待字体
   */

  try {

    await document.fonts.ready;

  } catch (error) {

    console.warn(
      "Font loading warning:",
      error
    );

  }


  /*
   * 等待所有照片
   */

  const images =
    [
      ...document.images
    ];


  await Promise.all(

    images.map(
      image => {

        if (
          image.complete
        ) {

          return Promise.resolve();

        }


        return new Promise(
          resolve => {

            image.addEventListener(
              "load",
              resolve,
              {
                once: true
              }
            );

            image.addEventListener(
              "error",
              resolve,
              {
                once: true
              }
            );

          }
        );

      }
    )

  );


  /*
   * 给浏览器一点时间
   * 完成字体和图片尺寸计算
   */

  await new Promise(
    resolve =>
      setTimeout(
        resolve,
        300
      )
  );


  paginate();


  /*
   * 分页完成以后
   * 再打开打印预览
   */

  setTimeout(
    () => {

      window.print();

    },
    500
  );

}


/* =====================================================
   PAGINATE
===================================================== */

function paginate() {

  const root =
    document.querySelector(
      "#print-root"
    );


  if (!root) {
    return;
  }


  const firstPage =
    root.querySelector(
      ".print-page"
    );


  if (!firstPage) {
    return;
  }


  /*
   * content-card
   */

  const card =
    firstPage.querySelector(
      ".content-card"
    );


  if (!card) {
    return;
  }


  /*
   * 把需要分页的 block
   * 全部先取出来
   */

  const blocks =
    [
      ...card.querySelectorAll(
        ".print-block"
      )
    ];


  /*
   * 记录 footer
   */

  const footer =
    card.querySelector(
      ".footer"
    );


  /*
   * 临时移除 footer
   * 最后只放在最后一页
   */

  if (footer) {

    footer.remove();

  }


  /*
   * 清除原来的 blocks
   */

  blocks.forEach(
    block =>
      block.remove()
  );


  /*
   * 页面顶部固定内容：
   *
   * header
   * category
   * title
   * intro
   * cover
   * info
   *
   * 这些先保留。
   */

  const fixedBlocks = [];


  const heading =
    card.querySelector(
      ".page-heading"
    );


  const category =
    card.querySelector(
      ".category"
    );


  const title =
    card.querySelector(
      "h1"
    );


  const intro =
    card.querySelector(
      ".intro"
    );


  const cover =
    card.querySelector(
      ".cover-wrap"
    );


  const info =
    card.querySelector(
      ".info-grid"
    );


  if (heading)
    fixedBlocks.push(
      heading
    );


  if (category)
    fixedBlocks.push(
      category
    );


  if (title)
    fixedBlocks.push(
      title
    );


  if (intro)
    fixedBlocks.push(
      intro
    );


  if (cover)
    fixedBlocks.push(
      cover
    );


  if (info)
    fixedBlocks.push(
      info
    );


  /*
   * 真正需要分页的 blocks
   */

  const flowBlocks =
    blocks.filter(
      block =>
        !fixedBlocks.includes(
          block
        )
    );


  /*
   * 原页面清空
   */

  card.innerHTML = "";


  /*
   * 创建第一张页面
   */

  let currentPage =
    firstPage;


  let currentCard =
    createPageCard(
      currentPage
    );


  /*
   * 加入固定内容
   */

  fixedBlocks.forEach(
    block =>
      currentCard.appendChild(
        block
      )
  );


  /*
   * 分页可用高度
   *
   * 不使用 297mm。
   *
   * 给 Safari 留安全空间。
   */

  const availableHeight =
    currentCard.clientHeight;


  /*
   * 添加 flow blocks
   */

  flowBlocks.forEach(
    block => {

      currentCard.appendChild(
        block
      );


      /*
       * 如果超过当前页面
       */

      if (
        currentCard.scrollHeight >
        availableHeight
      ) {

        /*
         * 移除刚刚放进去的 block
         */

        currentCard.removeChild(
          block
        );


        /*
         * 新页面
         */

        currentPage =
          createNewPage(
            root,
            backgroundURL
          );


        currentCard =
          currentPage.querySelector(
            ".content-card"
          );


        /*
         * 再放进去
         */

        currentCard.appendChild(
          block
        );

      }

    }
  );


  /*
   * 最后一页 footer
   */

  if (footer) {

    currentCard.appendChild(
      footer
    );

  }


  /*
   * 第一页已经有自己的背景
   * 新页面也会有背景
   */

}


/* =====================================================
   CREATE PAGE CARD
===================================================== */

function createPageCard(
  page
) {

  let card =
    page.querySelector(
      ".content-card"
    );


  if (!card) {

    card =
      document.createElement(
        "div"
      );

    card.className =
      "content-card";

    page.appendChild(
      card
    );

  }


  return card;

}


/* =====================================================
   CREATE NEW PAGE
===================================================== */

function createNewPage(
  root,
  backgroundURL
) {

  const page =
    document.createElement(
      "section"
    );


  page.className =
    "print-page";


  page.innerHTML = `

    <img
      class="page-background"
      src="${backgroundURL}"
      alt=""
    >

    <div
      class="content-card"
    ></div>

  `;


  root.appendChild(
    page
  );


  return page;

}


/* =====================================================
   START
===================================================== */

preparePrint();

</script>


</body>

</html>

  `);


  printWindow.document.close();

}

  

async function shareRecipe(recipe) {
  const text = [
    recipe.title,
    recipe.intro,
    "",
    "食材：",
    ...(recipe.ingredients || [])
      .map(
        item =>
          `${item.name} ${item.amount || ""}`
      ),
    "",
    "步骤：",
    ...(recipe.steps || [])
      .map(
        (step, index) =>
          `${index + 1}. ${step.text}`
      )
  ].join("\n");

  if (
    navigator.share
  ) {
    try {
      await navigator.share({
        title:
          recipe.title ||
          "芳芳的小厨房日记",

        text
      });
    } catch {
      // user cancelled
    }

    return;
  }

  await navigator.clipboard?.writeText(
    text
  );

  alert(
    "食谱内容已经复制，可以分享 ♡"
  );
}


// ==================================================
// PHOTO
// ==================================================

function fileToDataURL(file) {
  return new Promise(
    (resolve, reject) => {
      const reader =
        new FileReader();

      reader.onload =
        () =>
          resolve(
            reader.result
          );

      reader.onerror =
        reject;

      reader.readAsDataURL(
        file
      );
    }
  );
}


// ==================================================
// NAVIGATION
// ==================================================

document.addEventListener(
  "click",
  event => {
    const nav =
      event.target.closest(
        "[data-nav]"
      );

    if (!nav) return;

    showPage(
      nav.dataset.nav
    );
  }
);


// ==================================================
// SNOW
// ==================================================

function startSnow() {
  if (
    document.querySelector(
      ".snow-layer"
    )
  ) {
    return;
  }

  const layer =
    document.createElement(
      "div"
    );

  layer.className =
    "snow-layer";

  for (
    let i = 0;
    i < 18;
    i++
  ) {
    const snow =
      document.createElement(
        "span"
      );

    snow.textContent =
      Math.random() > 0.5
        ? "✦"
        : "·";

    snow.style.left =
      `${Math.random() * 100}%`;

    snow.style.animationDuration =
      `${8 + Math.random() * 8}s`;

    snow.style.animationDelay =
      `${Math.random() * 8}s`;

    snow.style.opacity =
      `${0.25 + Math.random() * 0.5}`;

    layer.appendChild(
      snow
    );
  }

  document.body.appendChild(
    layer
  );
}


// ==================================================
// STORE UPDATE
// ==================================================

store.subscribe(() => {
  render();
});

(async () => {
  await store.ready;

  startSnow();

  render();
})();

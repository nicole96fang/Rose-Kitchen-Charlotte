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
  const photos = Array.isArray(recipe.photos) ? recipe.photos : [];
  const coverPhoto = recipe.cover || photos[0] || "";
  const galleryPhotos = photos.filter((photo) => photo !== coverPhoto);

  const baseURL = window.location.href;

  const backgroundURL = new URL(
    "./assets/app-background.jpg",
    baseURL
  ).href;

  const fontURL = new URL(
    "./assets/fonts/泥木扭扭体NeedMood NiuNiu.ttf",
    baseURL
  ).href;

  const printWindow = window.open("", "_blank");

  if (!printWindow) {
    showToast("请允许弹出窗口后再打印");
    return;
  }

  const safe = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const ingredients = Array.isArray(recipe.ingredients)
    ? recipe.ingredients
    : [];

  const steps = Array.isArray(recipe.steps)
    ? recipe.steps
    : [];

  const ingredientHTML = ingredients.length
    ? ingredients
        .map(
          (item) => `
            <div class="ingredient-row">
              <span>${safe(item.name)}</span>
              <span>${safe(item.amount)}</span>
            </div>
          `
        )
        .join("")
    : `<div class="empty-text">暂无食材记录</div>`;

  const stepHTML = steps.length
    ? steps
        .map(
          (step, index) => `
            <div class="step-item">
              <div class="step-number">${index + 1}</div>
              <div class="step-content">${safe(step)}</div>
            </div>
          `
        )
        .join("")
    : `<div class="empty-text">暂无步骤记录</div>`;

  const coverHTML = coverPhoto
    ? `
      <div class="cover-wrap">
        <img src="${coverPhoto}" alt="">
      </div>
    `
    : "";

  const photoHTML = galleryPhotos.length
    ? galleryPhotos
        .map(
          (photo) => `
            <div class="photo-box">
              <img src="${photo}" alt="">
            </div>
          `
        )
        .join("")
    : "";

  const infoHTML = `
    <div class="recipe-info">
      ${
        recipe.servings
          ? `<span>🍽 ${safe(recipe.servings)}</span>`
          : ""
      }

      ${
        recipe.time
          ? `<span>⏱ ${safe(recipe.time)}</span>`
          : ""
      }

      ${
        recipe.category
          ? `<span>♡ ${safe(recipe.category)}</span>`
          : ""
      }
    </div>
  `;

  printWindow.document.write(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">

<style>

@font-face {
  font-family: "NeedMoodNiuNiu";
  src: url("${fontURL}") format("truetype");
  font-style: normal;
  font-weight: 100 900;
  font-display: block;
}

@page {
  size: A4 portrait;
  margin: 0;
}

* {
  box-sizing: border-box;
  font-family: "NeedMoodNiuNiu", sans-serif !important;
}

html,
body {
  margin: 0;
  padding: 0;
  background: transparent;
}

body {
  color: #455b61;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

/* =========================
   每一张真正独立的 A4
   ========================= */

.print-page {
  position: relative;

  width: 210mm;
  height: 280mm;

  margin: 0 0 17mm 0;
  padding: 7mm;

  overflow: visible;

  break-after: auto;
  page-break-after: auto;
}

.print-page + .print-page {
  break-before: page;
  page-break-before: always;
}

/* 每一页都有完整背景 */

.page-background {
  position: absolute;

  left: 0;
  top: 0;

  width: 210mm;
  height: 297mm;

  max-width: none;
  max-height: none;

  object-fit: cover;

  z-index: 0;

  opacity: 0.72;
}

  object-fit: cover;

  z-index: 0;

  opacity: 0.72;
}

/* 内容卡片 */

.content-card {
  position: relative;
  z-index: 2;

  width: 100%;
  height: 283mm;
  min-height: 283mm;
  max-height: 283mm;

  padding: 7mm;

  overflow: hidden;

  border-radius: 8mm;

  background: rgba(255, 255, 255, 0.72);

  border: 1px solid rgba(255,255,255,0.85);
}

/* =========================
   第一页
   ========================= */

.recipe-header {
  text-align: center;
  margin-bottom: 6mm;
}

.recipe-title {
  margin: 0;

  color: #405960;

  font-size: 25px;
  line-height: 1.25;

  font-weight: 700;
}

.recipe-intro {
  margin-top: 3mm;

  color: #70858a;

  font-size: 13px;
  line-height: 1.7;
}

.cover-wrap {
  width: 100%;

  margin: 0 auto 6mm;

  border-radius: 6mm;

  overflow: hidden;

  background: rgba(235,244,245,0.65);

  break-inside: avoid;
  page-break-inside: avoid;
}

.cover-wrap img {
  display: block;

  width: 100%;

  max-height: 65mm;

  object-fit: contain;

  margin: auto;
}

.recipe-info {
  display: flex;

  justify-content: center;

  align-items: center;

  gap: 7mm;

  flex-wrap: wrap;

  margin-bottom: 6mm;

  color: #63797e;

  font-size: 12px;
}

.print-section {
  margin-bottom: 6mm;

  break-inside: avoid;
  page-break-inside: avoid;
}

.print-section h2 {
  margin: 0 0 3mm;

  padding-bottom: 2mm;

  border-bottom: 1px solid rgba(103,133,140,0.25);

  color: #536c72;

  font-size: 16px;
}

.ingredient-row {
  display: flex;

  justify-content: space-between;

  gap: 8mm;

  padding: 2mm 1mm;

  border-bottom: 1px dashed rgba(103,133,140,0.18);

  font-size: 12px;

  break-inside: avoid;
  page-break-inside: avoid;
}

.empty-text {
  color: #91a2a6;
  font-size: 12px;
}

.step-list {
  display: flex;

  flex-direction: column;

  gap: 2.5mm;
}

.step-item {
  display: flex;

  align-items: flex-start;

  gap: 3mm;

  break-inside: avoid;
  page-break-inside: avoid;
}

.step-number {
  flex: 0 0 8mm;

  width: 8mm;
  height: 8mm;

  border-radius: 50%;

  background: rgba(126,164,171,0.18);

  color: #536c72;

  display: flex;

  align-items: center;
  justify-content: center;

  font-size: 11px;
}

.step-content {
  flex: 1;

  font-size: 12px;

  line-height: 1.65;

  color: #53666b;
}

/* =========================
   第二页：照片
   ========================= */

.photo-page .content-card {
  padding: 7mm;
}

.photo-title {
  text-align: center;

  margin: 0 0 7mm;

  color: #536c72;

  font-size: 18px;
}

.photo-grid {
  display: grid;

  grid-template-columns: repeat(2, 1fr);

  gap: 5mm;
}

.photo-box {
  width: 100%;

  height: 65mm;

  border-radius: 5mm;

  overflow: hidden;

  background: rgba(236,244,244,0.65);

  display: flex;

  align-items: center;
  justify-content: center;

  break-inside: avoid;
  page-break-inside: avoid;
}

.photo-box img {
  display: block;

  width: 100%;
  height: 100%;

  object-fit: contain;
}

/* footer */

.print-footer {
  position: absolute;

  left: 7mm;
  right: 7mm;

  bottom: 6mm;

  padding-top: 3mm;

  border-top: 1px solid rgba(103,133,140,0.2);

  text-align: center;

  color: #8a9a9e;

  font-size: 10px;
}

@media print {

  html,
  body {
    width: 210mm;
    margin: 0;
    padding: 0;
  }

  .print-page {
    width: 210mm;
    height: 280mm;

    min-height: 280mm;
    max-height: 280mm;

    margin: 0 0 17mm 0;
    padding: 7mm;

    overflow: visible;
  }
}

</style>
</head>

<body>

<!-- =========================
     第 1 页
     ========================= -->

<section class="print-page">

  <img
    class="page-background"
    src="${backgroundURL}"
    alt=""
  >

  <div class="content-card">

    ${coverHTML}

    <header class="recipe-header">

      <h1 class="recipe-title">
        ${safe(recipe.title || "我的食谱")}
      </h1>

      ${
        recipe.intro
          ? `
            <div class="recipe-intro">
              ${safe(recipe.intro)}
            </div>
          `
          : ""
      }

    </header>

    ${infoHTML}

    <section class="print-section">

      <h2>🥣 食材</h2>

      <div>
        ${ingredientHTML}
      </div>

    </section>

    <section class="print-section">

      <h2>👩🏻‍🍳 做法</h2>

      <div class="step-list">
        ${stepHTML}
      </div>

    </section>

    <div class="print-footer">
      芳芳的小厨房日记 · My Kitchen Rose
    </div>

  </div>

</section>


${
  galleryPhotos.length
    ? `
<!-- =========================
     第 2 页：完整照片页
     ========================= -->

<section class="print-page photo-page">

  <img
    class="page-background"
    src="${backgroundURL}"
    alt=""
  >

  <div class="content-card">

    <h2 class="photo-title">
      📷 制作照片
    </h2>

    <div class="photo-grid">
      ${photoHTML}
    </div>

    <div class="print-footer">
      芳芳的小厨房日记 · My Kitchen Rose
    </div>

  </div>

</section>
`
    : ""
}

<script>

function waitForImages() {

  const images = Array.from(document.images);

  return Promise.all(
    images.map((img) => {

      if (img.complete) {
        return Promise.resolve();
      }

      return new Promise((resolve) => {

        img.onload = resolve;
        img.onerror = resolve;

      });

    })
  );
}

async function preparePrint() {

  try {

    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

  } catch (e) {}

  await waitForImages();

  setTimeout(() => {

    window.print();

  }, 500);
}

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

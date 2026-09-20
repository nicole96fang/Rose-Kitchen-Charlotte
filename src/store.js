// 芳芳的小厨房日记
// Local-first storage
// 所有资料保存在浏览器本地，不需要后端

const DB_NAME = "FangFangKitchenDiary";
const DB_VERSION = 1;

const STORES = {
  recipes: "recipes",
  shopping: "shopping",
  settings: "settings"
};

const DEFAULT_SETTINGS = {
  chefName: "芳芳",
  bio: "用喜欢的食物，过喜欢的生活 ♡",
  avatar: "",
};

const DB = {
  open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;

        if (!db.objectStoreNames.contains(STORES.recipes)) {
          const store = db.createObjectStore(STORES.recipes, {
            keyPath: "id",
          });

          store.createIndex("category", "category", { unique: false });
          store.createIndex("favorite", "favorite", { unique: false });
          store.createIndex("updatedAt", "updatedAt", { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.shopping)) {
          db.createObjectStore(STORES.shopping, {
            keyPath: "id",
          });
        }

        if (!db.objectStoreNames.contains(STORES.settings)) {
          db.createObjectStore(STORES.settings, {
            keyPath: "id",
          });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  transaction(storeName, mode = "readonly") {
    return this.open().then((db) =>
      db.transaction(storeName, mode).objectStore(storeName)
    );
  },

  getAll(storeName) {
    return this.transaction(storeName).then(
      (store) =>
        new Promise((resolve, reject) => {
          const request = store.getAll();

          request.onsuccess = () => resolve(request.result || []);
          request.onerror = () => reject(request.error);
        })
    );
  },

  get(storeName, id) {
    return this.transaction(storeName).then(
      (store) =>
        new Promise((resolve, reject) => {
          const request = store.get(id);

          request.onsuccess = () => resolve(request.result || null);
          request.onerror = () => reject(request.error);
        })
    );
  },

  put(storeName, data) {
    return this.transaction(storeName, "readwrite").then(
      (store) =>
        new Promise((resolve, reject) => {
          const request = store.put(data);

          request.onsuccess = () => resolve(data);
          request.onerror = () => reject(request.error);
        })
    );
  },

  delete(storeName, id) {
    return this.transaction(storeName, "readwrite").then(
      (store) =>
        new Promise((resolve, reject) => {
          const request = store.delete(id);

          request.onsuccess = () => resolve(true);
          request.onerror = () => reject(request.error);
        })
    );
  },

  clear(storeName) {
    return this.transaction(storeName, "readwrite").then(
      (store) =>
        new Promise((resolve, reject) => {
          const request = store.clear();

          request.onsuccess = () => resolve(true);
          request.onerror = () => reject(request.error);
        })
    );
  },
};


// --------------------------------------------------
// Helpers
// --------------------------------------------------

export function createId(prefix = "item") {
  return `${prefix}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export function now() {
  return new Date().toISOString();
}


// --------------------------------------------------
// Recipes
// --------------------------------------------------

export async function getRecipes() {
  const recipes = await DB.getAll(STORES.recipes);

  return recipes.sort((a, b) => {
    return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
  });
}

export async function getRecipe(id) {
  return DB.get(STORES.recipes, id);
}

export async function getRecipesByCategory(category) {
  const recipes = await getRecipes();

  return recipes.filter((recipe) => recipe.category === category);
}

export async function getFavoriteRecipes() {
  const recipes = await getRecipes();

  return recipes.filter((recipe) => recipe.favorite === true);
}

export async function saveRecipe(recipe) {
  const existing = recipe.id ? await getRecipe(recipe.id) : null;

  const savedRecipe = {
    id: recipe.id || createId("recipe"),

    category: recipe.category || "其他",

    name: recipe.name || "",
    description: recipe.description || "",

    servings: recipe.servings || "",
    cookingTime: recipe.cookingTime || "",

    ingredients: Array.isArray(recipe.ingredients)
      ? recipe.ingredients
      : [],

    steps: Array.isArray(recipe.steps)
      ? recipe.steps
      : [],

    photos: Array.isArray(recipe.photos)
      ? recipe.photos
      : [],

    coverPhoto: recipe.coverPhoto || "",

    favorite:
      typeof recipe.favorite === "boolean"
        ? recipe.favorite
        : existing?.favorite || false,

    createdAt:
      existing?.createdAt ||
      recipe.createdAt ||
      now(),

    updatedAt: now(),
  };

  await DB.put(STORES.recipes, savedRecipe);

  return savedRecipe;
}

export async function deleteRecipe(id) {
  return DB.delete(STORES.recipes, id);
}

export async function toggleFavorite(id) {
  const recipe = await getRecipe(id);

  if (!recipe) {
    return null;
  }

  recipe.favorite = !recipe.favorite;
  recipe.updatedAt = now();

  await DB.put(STORES.recipes, recipe);

  return recipe;
}


// --------------------------------------------------
// Ingredients
// --------------------------------------------------

export function createIngredient(
  name = "",
  amount = ""
) {
  return {
    id: createId("ingredient"),
    name,
    amount,
  };
}

export function addIngredient(recipe) {
  const ingredients = Array.isArray(recipe.ingredients)
    ? [...recipe.ingredients]
    : [];

  ingredients.push(createIngredient());

  return {
    ...recipe,
    ingredients,
  };
}

export function removeIngredient(recipe, id) {
  return {
    ...recipe,
    ingredients: (recipe.ingredients || []).filter(
      (item) => item.id !== id
    ),
  };
}


// --------------------------------------------------
// Cooking steps
// --------------------------------------------------

export function createStep(text = "") {
  return {
    id: createId("step"),
    text,
  };
}

export function addStep(recipe) {
  const steps = Array.isArray(recipe.steps)
    ? [...recipe.steps]
    : [];

  steps.push(createStep());

  return {
    ...recipe,
    steps,
  };
}

export function removeStep(recipe, id) {
  return {
    ...recipe,
    steps: (recipe.steps || []).filter(
      (item) => item.id !== id
    ),
  };
}


// --------------------------------------------------
// Shopping list
// --------------------------------------------------

export async function getShoppingLists() {
  const lists = await DB.getAll(STORES.shopping);

  return lists.sort((a, b) => {
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });
}

export async function saveShoppingList(list) {
  const saved = {
    id: list.id || createId("shopping"),

    title: list.title || "今天要买什么？",

    items: Array.isArray(list.items)
      ? list.items
      : [],

    createdAt:
      list.createdAt ||
      now(),

    updatedAt: now(),
  };

  await DB.put(STORES.shopping, saved);

  return saved;
}

export async function deleteShoppingList(id) {
  return DB.delete(STORES.shopping, id);
}

export function createShoppingItem(
  name = "",
  quantity = ""
) {
  return {
    id: createId("shopping-item"),
    name,
    quantity,
    completed: false,
  };
}

export async function toggleShoppingItem(
  listId,
  itemId
) {
  const list = await DB.get(
    STORES.shopping,
    listId
  );

  if (!list) {
    return null;
  }

  list.items = (list.items || []).map((item) => {
    if (item.id === itemId) {
      return {
        ...item,
        completed: !item.completed,
      };
    }

    return item;
  });

  list.updatedAt = now();

  await DB.put(STORES.shopping, list);

  return list;
}


// --------------------------------------------------
// Settings / Chef profile
// --------------------------------------------------

export async function getSettings() {
  const settings = await DB.get(
    STORES.settings,
    "profile"
  );

  return {
    ...DEFAULT_SETTINGS,
    ...(settings || {}),
  };
}

export async function saveSettings(settings) {
  const saved = {
    id: "profile",

    ...DEFAULT_SETTINGS,

    ...settings,

    updatedAt: now(),
  };

  await DB.put(STORES.settings, saved);

  return saved;
}


// --------------------------------------------------
// Backup
// --------------------------------------------------

export async function createBackup() {
  const recipes = await getRecipes();
  const shopping = await getShoppingLists();
  const settings = await getSettings();

  return {
    app: "芳芳的小厨房日记",
    version: 1,

    exportedAt: now(),

    recipes,
    shopping,
    settings,
  };
}

export async function downloadBackup() {
  const backup = await createBackup();

  const json = JSON.stringify(
    backup,
    null,
    2
  );

  const blob = new Blob(
    [json],
    {
      type: "application/json",
    }
  );

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");

  a.href = url;

  const date = new Date()
    .toISOString()
    .slice(0, 10);

  a.download =
    `芳芳的小厨房日记-backup-${date}.json`;

  document.body.appendChild(a);

  a.click();

  a.remove();

  URL.revokeObjectURL(url);
}


// --------------------------------------------------
// Restore
// --------------------------------------------------

export async function restoreBackup(file) {
  if (!file) {
    throw new Error("没有选择备份文件");
  }

  const text = await file.text();

  const backup = JSON.parse(text);

  if (
    !backup ||
    backup.app !== "芳芳的小厨房日记"
  ) {
    throw new Error(
      "这不是有效的芳芳的小厨房日记备份文件"
    );
  }

  await DB.clear(STORES.recipes);
  await DB.clear(STORES.shopping);
  await DB.clear(STORES.settings);

  for (const recipe of backup.recipes || []) {
    await DB.put(
      STORES.recipes,
      recipe
    );
  }

  for (const list of backup.shopping || []) {
    await DB.put(
      STORES.shopping,
      list
    );
  }

  if (backup.settings) {
    await DB.put(
      STORES.settings,
      {
        id: "profile",
        ...backup.settings,
      }
    );
  }

  return true;
}


// --------------------------------------------------
// Export PDF / Print helper
// --------------------------------------------------

export function printRecipe(recipe) {
  if (!recipe) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(
      "fangfang:print-recipe",
      {
        detail: recipe,
      }
    )
  );
}


// --------------------------------------------------
// Search
// --------------------------------------------------

export async function searchRecipes(query) {
  const recipes = await getRecipes();

  const keyword = String(query || "")
    .trim()
    .toLowerCase();

  if (!keyword) {
    return recipes;
  }

  return recipes.filter((recipe) => {
    const text = [
      recipe.name,
      recipe.description,
      recipe.category,
      recipe.servings,
      recipe.cookingTime,

      ...(recipe.ingredients || []).map(
        (item) =>
          `${item.name} ${item.amount}`
      ),

      ...(recipe.steps || []).map(
        (step) => step.text
      ),
    ]
      .join(" ")
      .toLowerCase();

    return text.includes(keyword);
  });
}


// --------------------------------------------------
// Statistics
// --------------------------------------------------

export async function getStatistics() {
  const recipes = await getRecipes();

  const favoriteCount = recipes.filter(
    (recipe) => recipe.favorite
  ).length;

  const categoryCount =
    new Set(
      recipes.map(
        (recipe) => recipe.category
      )
    ).size;

  return {
    totalRecipes: recipes.length,
    favoriteRecipes: favoriteCount,
    usedCategories: categoryCount,
  };
}


// --------------------------------------------------
// New empty recipe
// --------------------------------------------------

export function createEmptyRecipe(
  category = "其他"
) {
  return {
    id: createId("recipe"),

    category,

    name: "",
    description: "",

    servings: "",
    cookingTime: "",

    ingredients: [
      createIngredient(),
    ],

    steps: [
      createStep(),
    ],

    photos: [],

    coverPhoto: "",

    favorite: false,

    createdAt: now(),
    updatedAt: now(),
  };
}

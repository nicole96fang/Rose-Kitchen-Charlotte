const DB_NAME = "fangfang-kitchen-diary";
const DB_VERSION = 1;
const STORE_NAME = "app";

const categories = [
  ["chicken", "鸡肉", "/assets/icons/chicken.png"],
  ["pork", "猪肉", "/assets/icons/pork.png"],
  ["fish", "鱼肉", "/assets/icons/fish.png"],
  ["seafood", "海鲜", "/assets/icons/seafood.png"],
  ["vegetable", "蔬菜", "/assets/icons/vegetables.png"],
  ["soup", "汤类", "/assets/icons/soup.png"],
  ["rice", "饭类", "/assets/icons/rice.png"],
  ["noodle", "面类", "/assets/icons/noodles.png"],
  ["egg", "鸡蛋", "/assets/icons/egg.png"],
  ["chinese-dessert", "中式甜点", "/assets/icons/chinese-dessert.png"],
  ["coffee", "咖啡", "/assets/icons/coffee.png"],
  ["drinks", "饮料", "/assets/icons/drinks.png"],
  ["tofu", "豆腐", "/assets/icons/tofu.png"],
  ["wellness", "养生", "/assets/icons/healthy.png"],
  ["western-dessert", "西式甜点", "/assets/icons/western-dessert.png"],
  ["sauce", "酱料", "/assets/icons/sauce.png"],
  ["other", "其他", "/assets/icons/other.png"]
].map(([id, name, icon]) => ({
  id,
  name,
  icon
}));

const defaultState = {
  version: 1,

  recipes: [],

  shoppingLists: [],

  profile: {
    name: "芳芳",
    bio: "用喜欢的食物，过喜欢的生活 ♡",
    avatar: ""
  },

  settings: {
    snow: true
  }
};

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

async function readDB() {
  try {
    const db = await openDB();

    return await new Promise((resolve, reject) => {
      const tx = db.transaction(
        STORE_NAME,
        "readonly"
      );

      const request = tx
        .objectStore(STORE_NAME)
        .get("state");

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch {
    try {
      return JSON.parse(
        localStorage.getItem(DB_NAME) || "null"
      );
    } catch {
      return null;
    }
  }
}

async function writeDB(state) {
  try {
    const db = await openDB();

    await new Promise((resolve, reject) => {
      const tx = db.transaction(
        STORE_NAME,
        "readwrite"
      );

      tx.objectStore(STORE_NAME).put(
        state,
        "state"
      );

      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    localStorage.setItem(
      DB_NAME,
      JSON.stringify(state)
    );
  }
}

function uid(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function normalizeState(raw) {
  const s =
    raw && typeof raw === "object"
      ? raw
      : {};

  return {
    ...structuredClone(defaultState),

    ...s,

    recipes: Array.isArray(s.recipes)
      ? s.recipes
      : [],

    shoppingLists: Array.isArray(
      s.shoppingLists
    )
      ? s.shoppingLists
      : [],

    profile: {
      ...defaultState.profile,
      ...(s.profile || {})
    },

    settings: {
      ...defaultState.settings,
      ...(s.settings || {})
    }
  };
}

export function createStore() {
  let state =
    normalizeState(null);

  const listeners = new Set();

  let readyResolve;

  const ready = new Promise(
    resolve => {
      readyResolve = resolve;
    }
  );

  (async () => {
    const saved =
      await readDB();

    state =
      normalizeState(saved);

    readyResolve(state);

    listeners.forEach(
      fn => fn(state)
    );
  })();

  const api = {
    categories,

    ready,

    getState() {
      return state;
    },

    subscribe(fn) {
      listeners.add(fn);

      return () =>
        listeners.delete(fn);
    },

    async setState(next) {
      state =
        normalizeState(
          typeof next === "function"
            ? next(state)
            : next
        );

      await writeDB(state);

      listeners.forEach(
        fn => fn(state)
      );

      return state;
    },

    async upsertRecipe(recipe) {
      const next = {
        ...recipe,

        id:
          recipe.id ||
          uid("recipe"),

        updatedAt:
          new Date().toISOString()
      };

      const list = [
        ...state.recipes
      ];

      const index =
        list.findIndex(
          r => r.id === next.id
        );

      if (index >= 0) {
        list[index] = next;
      } else {
        list.unshift(next);
      }

      await api.setState({
        ...state,
        recipes: list
      });

      return next;
    },

    async deleteRecipe(id) {
      return api.setState({
        ...state,

        recipes:
          state.recipes.filter(
            r => r.id !== id
          )
      });
    },

    async toggleFavorite(id) {
      return api.setState({
        ...state,

        recipes:
          state.recipes.map(
            r =>
              r.id === id
                ? {
                    ...r,
                    favorite:
                      !r.favorite
                  }
                : r
          )
      });
    },

    async addShoppingList(list) {
      const item = {
        ...list,

        id: uid("list"),

        createdAt:
          new Date().toISOString()
      };

      return api.setState({
        ...state,

        shoppingLists: [
          item,
          ...state.shoppingLists
        ]
      });
    },

    async updateShoppingList(
      id,
      patch
    ) {
      return api.setState({
        ...state,

        shoppingLists:
          state.shoppingLists.map(
            item =>
              item.id === id
                ? {
                    ...item,
                    ...patch
                  }
                : item
          )
      });
    },

    async deleteShoppingList(id) {
      return api.setState({
        ...state,

        shoppingLists:
          state.shoppingLists.filter(
            item =>
              item.id !== id
          )
      });
    },

    async updateProfile(profile) {
      return api.setState({
        ...state,

        profile: {
          ...state.profile,
          ...profile
        }
      });
    },

    async resetAll() {
      return api.setState(
        structuredClone(
          defaultState
        )
      );
    },

    async exportBackup() {
      await ready;

      const blob = new Blob(
        [
          JSON.stringify(
            state,
            null,
            2
          )
        ],
        {
          type:
            "application/json"
        }
      );

      const url =
        URL.createObjectURL(
          blob
        );

      const a =
        document.createElement(
          "a"
        );

      a.href = url;

      a.download =
        `芳芳的小厨房日记-备份-${new Date()
          .toISOString()
          .slice(0, 10)}.json`;

      document.body.appendChild(a);

      a.click();

      a.remove();

      setTimeout(
        () =>
          URL.revokeObjectURL(
            url
          ),
        1000
      );
    },

    async importBackup(file) {
      const text =
        await file.text();

      const incoming =
        normalizeState(
          JSON.parse(text)
        );

      await api.setState(
        incoming
      );
    }
  };

  return api;
}

export function blankRecipe(
  categoryId = "chicken"
) {
  return {
    id: null,

    categoryId,

    title: "",

    intro: "",

    servings: "",

    time: "",

    ingredients: [
      {
        name: "",
        amount: ""
      }
    ],

    steps: [
      {
        text: ""
      }
    ],

    photos: [],

    cover: "",

    favorite: false,

    createdAt:
      new Date().toISOString(),

    updatedAt:
      new Date().toISOString()
  };
}

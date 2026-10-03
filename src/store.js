const DB_NAME = "fangfang-kitchen-diary";
const DB_VERSION = 1;
const STORE_NAME = "app";

// localStorage 兜底键（IndexedDB 不可用时接管）
const LS_KEY = DB_NAME;

// IndexedDB 超时时间。
// iOS Safari 在「无痕浏览 / 阻止跨站跟踪」下，open 请求可能既不 success
// 也不 error，而是永久挂起 —— 这会让保存按钮看起来「点了没反应」。
// 所以必须自带超时，超时后立刻降级到 localStorage。
// 放宽到 6 秒：主屏书签容器首次建库偏慢，太短会误判成「不可用」
// 而降级到 localStorage，反而更容易撑爆内存。
const DB_TIMEOUT = 6000;

// localStorage 安全字符数上限。
// 配额名义 5MB，但 iOS 主屏书签容器里序列化大字符串会瞬间拉高内存峰值
// 并导致闪退，所以留出很大余量，超过就直接改用精简版。
const LS_SAFE_CHARS = 1500000;

// 运行期标记：一旦 IndexedDB 被证明不可用，后续直接走兜底，避免每次保存都卡住
let indexedDBAvailable = true;

// iOS Safari 15.4 以下没有 structuredClone。
// 缺失时会在保存的第一行就抛 ReferenceError，导致整个保存静默失败。
if (typeof structuredClone !== "function") {
  globalThis.structuredClone = value =>
    JSON.parse(JSON.stringify(value));
}

function clone(value) {
  return structuredClone(value);
}

// 给 IndexedDB 的异步操作套上超时，避免永久挂起
function withTimeout(promise, ms, message) {
  return new Promise((resolve, reject) => {
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error(message));
    }, ms);

    promise.then(
      value => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(value);
      },
      error => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

const categories = [
  ["chicken", "鸡肉", "./assets/icons/chicken.png"],
  ["pork", "猪肉", "./assets/icons/pork.png"],
  ["fish", "鱼肉", "./assets/icons/fish.png"],
  ["seafood", "海鲜", "./assets/icons/seafood.png"],
  ["vegetable", "蔬菜", "./assets/icons/vegetables.png"],
  ["soup", "汤类", "./assets/icons/soup.png"],
  ["rice", "饭类", "./assets/icons/rice.png"],
  ["noodle", "面类", "./assets/icons/noodles.png"],
  ["egg", "鸡蛋", "./assets/icons/egg.png"],
  ["chinese-dessert", "中式甜点", "./assets/icons/chinese-dessert.png"],
  ["coffee", "咖啡", "./assets/icons/coffee.png"],
  ["drinks", "饮料", "./assets/icons/drinks.png"],
  ["tofu", "豆腐", "./assets/icons/tofu.png"],
  ["wellness", "养生", "./assets/icons/healthy.png"],
  ["western-dessert", "西式甜点", "./assets/icons/western-dessert.png"],
  ["sauce", "酱料", "./assets/icons/sauce.png"],
  ["other", "其他", "./assets/icons/other.png"]
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
  if (!indexedDBAvailable) {
    return Promise.reject(
      new Error("IndexedDB 已判定为不可用")
    );
  }

  const opening = new Promise((resolve, reject) => {
    let request;

    try {
      request = indexedDB.open(DB_NAME, DB_VERSION);
    } catch (error) {
      // iOS Safari 无痕模式下，访问 indexedDB 本身就可能直接抛错
      reject(error);
      return;
    }

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
      reject(
        request.error ||
          new Error("IndexedDB 打开失败")
      );
    };

    request.onblocked = () => {
      reject(
        new Error("IndexedDB 被其他页面占用")
      );
    };
  });

  return withTimeout(
    opening,
    DB_TIMEOUT,
    "IndexedDB 打开超时"
  ).catch(error => {
    indexedDBAvailable = false;
    throw error;
  });
}

function readLocalStorage() {
  try {
    return JSON.parse(
      localStorage.getItem(LS_KEY) || "null"
    );
  } catch {
    return null;
  }
}

async function readDB() {
  let fromDB = null;

  try {
    const db = await openDB();

    fromDB = await new Promise((resolve, reject) => {
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
    fromDB = null;
  }

  // IndexedDB 里没有数据时，回读 localStorage。
  // 这样即使之前是靠兜底存下来的食谱，也不会凭空消失。
  if (!fromDB) return readLocalStorage();

  return fromDB;
}


async function writeDB(state) {
  const db = await openDB();

  const writing = new Promise((resolve, reject) => {
    const tx = db.transaction(
      STORE_NAME,
      "readwrite"
    );

    tx.objectStore(STORE_NAME).put(
      state,
      "state"
    );

    tx.oncomplete = () => {
      db.close();
      resolve();
    };

    tx.onerror = () => {
      const error =
        tx.error ||
        new Error("IndexedDB 写入失败");

      db.close();
      reject(error);
    };

    tx.onabort = () => {
      const error =
        tx.error ||
        new Error("IndexedDB 储存空间不足或交易中断");

      db.close();
      reject(error);
    };
  });

  return withTimeout(
    writing,
    DB_TIMEOUT,
    "IndexedDB 写入超时"
  ).catch(error => {
    indexedDBAvailable = false;
    throw error;
  });
}

// 估算照片/封面占用的字符数。
// 只累加长度、不做序列化，所以本身几乎不耗内存，
// 可以在真正 stringify 之前就判断「这数据能不能安全塞进 localStorage」。
function photoBytes(state) {
  let n = 0;

  for (const recipe of state.recipes || []) {
    for (const photo of recipe.photos || []) {
      if (typeof photo === "string") {
        n += photo.length;
      }
    }

    if (typeof recipe.cover === "string") {
      n += recipe.cover.length;
    }
  }

  const avatar =
    state.profile && state.profile.avatar;

  if (typeof avatar === "string") {
    n += avatar.length;
  }

  return n;
}

// 去掉照片的精简版本，用于空间不足时的最后抢救
function slimState(state) {
  return {
    ...state,

    recipes: (state.recipes || []).map(
      recipe => ({
        ...recipe,
        photos: [],
        cover: ""
      })
    ),

    profile: {
      ...state.profile,
      avatar: ""
    }
  };
}

/**
 * 分级持久化：
 *   1. IndexedDB（首选）
 *   2. localStorage 完整版
 *   3. localStorage 精简版（丢照片，保住菜谱文字）
 *   4. 全部失败 —— 仅存内存
 *
 * 永远不抛错，只返回写入结果，交给界面提示用户。
 */
async function persist(state) {
  try {
    await writeDB(state);

    return {
      ok: true,
      channel: "indexeddb"
    };
  } catch (error) {
    indexedDBAvailable = false;
  }

  // 照片多的时候绝不能做完整序列化：
  // JSON.stringify 会一次性生成一个几十 MB 的字符串，
  // 在 iOS 主屏书签容器里就是「点保存 → 闪退回主屏幕」。
  const heavy =
    photoBytes(state) > LS_SAFE_CHARS;

  if (!heavy) {
    try {
      localStorage.setItem(
        LS_KEY,
        JSON.stringify(state)
      );

      return {
        ok: true,
        channel: "localstorage"
      };
    } catch {
      // 多半是空间不足
    }
  }

  // 精简版：丢掉照片，保住菜谱文字
  try {
    const text = JSON.stringify(
      slimState(state)
    );

    if (text.length <= LS_SAFE_CHARS) {
      localStorage.setItem(
        LS_KEY,
        text
      );

      return {
        ok: true,
        channel: "localstorage-slim",
        slim: true
      };
    }
  } catch {
    // 彻底没救
  }

  return {
    ok: false,
    channel: "memory",
    error: new Error("本机储存不可用")
  };
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

    // 最近一次写入本机的结果，界面用它决定提示文案
    lastPersist: null,

    // 供界面做存储体检
    storageStatus() {
      return {
        indexedDB: indexedDBAvailable,
        channel:
          api.lastPersist?.channel || null
      };
    },

    getState() {
      return state;
    },

    subscribe(fn) {
      listeners.add(fn);

      return () =>
        listeners.delete(fn);
    },

    
async setState(next) {
  const nextState =
    normalizeState(
      typeof next === "function"
        ? next(state)
        : next
    );

  // 先更新内存与界面。
  // 即使本机储存写不进去，这次会话里食谱也不会丢，
  // 更不会出现「点了保存却毫无反应」的情况。
  state = nextState;

  const result =
    await persist(nextState);

  api.lastPersist = result;

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

    // 只生成备份文本，不触发任何系统动作（不下载、不分享）。
    //
    // iOS 主屏书签容器必须用这条路径：
    //   a.click() + download  → 容器被切走/杀掉（闪退回主屏幕）
    //   navigator.share()     → 在 Web Clip 里支持不稳定，且同样会切走容器
    // 只有「把文本放进页面里让用户自己拷贝」是绝对安全的。
    async buildBackup({
      slim = false
    } = {}) {
      await ready;

      const source =
        slim ? slimState(state) : state;

      const filename =
        `芳芳的小厨房日记-备份-${new Date()
          .toISOString()
          .slice(0, 10)}.json`;

      return {
        filename,

        json:
          JSON.stringify(
            source,
            null,
            2
          ),

        slim,

        photoCount:
          (state.recipes || []).reduce(
            (n, r) =>
              n +
              (r.photos
                ? r.photos.length
                : 0),
            0
          )
      };
    },

    // 不做序列化，只估算照片体积，用于在生成巨大字符串之前判断风险
    estimateBackupSize() {
      return photoBytes(state);
    },

    async exportBackup() {
      await ready;

      const filename =
        `芳芳的小厨房日记-备份-${new Date()
          .toISOString()
          .slice(0, 10)}.json`;

      const json =
        JSON.stringify(state, null, 2);

      // iOS（尤其是主屏书签容器）不具备网页下载能力。
      // 用 a.click() + download 会把整个容器切走甚至杀掉，
      // 表现就是「点了备份 → 闪退回主屏幕」。
      // 因此优先交给系统分享面板，由 iOS 原生接管存档。
      try {
        const file =
          new File([json], filename, {
            type: "application/json"
          });

        if (
          navigator.canShare &&
          navigator.canShare({
            files: [file]
          })
        ) {
          await navigator.share({
            files: [file],
            title: filename
          });

          return "shared";
        }
      } catch (error) {
        // 用户主动取消分享，不算失败
        if (
          error &&
          error.name === "AbortError"
        ) {
          return "cancelled";
        }

        // 其他错误则回退到下面的下载方式
      }

      // 桌面浏览器 / 不支持分享时，保留原来的下载方式
      const blob = new Blob(
        [json],
        {
          type: "application/json"
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

      a.download = filename;

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

      return "downloaded";
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

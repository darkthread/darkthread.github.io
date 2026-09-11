const { createApp, ref, computed, onMounted } = Vue;

createApp({
  setup() {
    const messages = {
      zh: {
        pageTitle: 'GitHub Copilot Models | 模型價格比較', subtitle: '模型與價格一覽', statsLabel: '資料統計',
        models: '模型', vendors: '供應商', pricingPlans: '價格方案', filtersLabel: '篩選條件', keyword: '關鍵字',
        searchPlaceholder: '搜尋模型名稱…', vendor: '供應商', category: '類別', reset: '清除篩選',
        loading: '載入中…', showing: (shown, total) => `顯示 ${shown} / ${total} 筆價格方案`, priceUnit: 'USD / 百萬 tokens',
        low: '低', high: '高', heatmap: '各欄價格熱度', loadFailed: '無法載入資料', retry: '重新載入',
        tableLabel: '模型價格表', tableCaption: 'GitHub Copilot 模型與價格，各欄可排序', sortBy: label => `依${label}排序`,
        unavailable: '無適用價格', loadingModels: '正在載入模型資料…', noModels: '沒有符合的模型', noResults: '無搜尋結果',
        source: '資料來源', officialPricing: 'GitHub 官方價格 ↗', fileProtocolError: '請透過本機 HTTP 伺服器開啟此頁面，以讀取 models.json。',
        fetchError: detail => `讀取 models.json 失敗：${detail}`, invalidData: '模型資料格式不正確', languageLabel: '語言'
      },
      en: {
        pageTitle: 'GitHub Copilot Models | Pricing Comparison', subtitle: 'Models and pricing at a glance', statsLabel: 'Data summary',
        models: 'Models', vendors: 'Vendors', pricingPlans: 'Pricing tiers', filtersLabel: 'Filters', keyword: 'Keyword',
        searchPlaceholder: 'Search model names…', vendor: 'Vendor', category: 'Category', reset: 'Reset filters',
        loading: 'Loading…', showing: (shown, total) => `Showing ${shown} of ${total} pricing tiers`, priceUnit: 'USD / million tokens',
        low: 'Low', high: 'High', heatmap: 'Price heatmap by column', loadFailed: 'Unable to load data', retry: 'Try again',
        tableLabel: 'Model pricing table', tableCaption: 'GitHub Copilot models and pricing; each column is sortable', sortBy: label => `Sort by ${label}`,
        unavailable: 'Price not available', loadingModels: 'Loading model data…', noModels: 'No matching models', noResults: 'No results found',
        source: 'Source', officialPricing: 'Official GitHub pricing ↗', fileProtocolError: 'Open this page through a local HTTP server to load models.json.',
        fetchError: detail => `Failed to load models.json: ${detail}`, invalidData: 'Invalid model data format', languageLabel: 'Language'
      }
    };
    const locale = ref(/^zh(?:-|$)/i.test(navigator.language) ? 'zh' : 'en');
    const t = (key, ...args) => typeof messages[locale.value][key] === 'function'
      ? messages[locale.value][key](...args)
      : messages[locale.value][key];
    const priceKeys = ['input', 'cached-input', 'cached-write', 'output'];
    const columns = computed(() => [
      { key: 'vendor', label: t('vendor') },
      { key: 'model', label: t('models') },
      { key: 'input', label: 'Input', price: true },
      { key: 'cached-input', label: 'Cache read', price: true },
      { key: 'cached-write', label: 'Cache write', price: true },
      { key: 'output', label: 'Output', price: true }
    ]);
    const rows = ref([]);
    const query = ref('');
    const vendor = ref([]);
    const category = ref([]);
    const sortKey = ref('output');
    const sortDirection = ref(-1);
    const loading = ref(true);
    const errorType = ref('');
    const errorDetail = ref('');
    const error = computed(() => errorType.value ? t(errorType.value, errorDetail.value) : '');
    const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
    const isMissing = value => value == null || value === '' || value === 'NA';
    const display = value => isMissing(value) ? '—' : value;
    const tierNote = row => row.tier === 'Long context' && !isMissing(row.threshold) && row.threshold !== '-'
      ? `(${row.threshold})`
      : '';
    const parsePrice = value => {
      if (isMissing(value)) return null;
      const parsed = Number(String(value).replace(/[$,]/g, ''));
      return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
    };
    const options = key => computed(() => [...new Set(rows.value.map(row => row[key]).filter(value => !isMissing(value)))].sort(collator.compare));
    const vendors = options('vendor');
    const categories = options('category');
    const modelCount = computed(() => new Set(rows.value.map(row => `${row.vendor}\0${row.model}`)).size);
    const hasFilters = computed(() => Boolean(query.value) ||
      vendor.value.length !== vendors.value.length ||
      category.value.length !== categories.value.length);
    const ranges = computed(() => Object.fromEntries(priceKeys.map(key => {
      const values = rows.value.map(row => row.prices[key]).filter(value => value !== null);
      return [key, { min: Math.min(...values), max: Math.max(...values) }];
    })));
    const filteredRows = computed(() => {
      const terms = query.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
      return rows.value.filter(row =>
        vendor.value.includes(row.vendor) &&
        category.value.includes(row.category) &&
        terms.every(term => row.searchText.includes(term))
      ).sort((first, second) => {
        const key = sortKey.value;
        const numeric = priceKeys.includes(key);
        const firstValue = numeric ? first.prices[key] : first[key];
        const secondValue = numeric ? second.prices[key] : second[key];
        if (isMissing(firstValue) || isMissing(secondValue)) {
          return Number(isMissing(firstValue)) - Number(isMissing(secondValue)) || first.id - second.id;
        }
        const comparison = numeric ? firstValue - secondValue : collator.compare(firstValue, secondValue);
        return comparison * sortDirection.value || first.id - second.id;
      });
    });
    function sortBy(key) {
      sortDirection.value = sortKey.value === key ? -sortDirection.value : 1;
      sortKey.value = key;
    }
    function reset() {
      query.value = '';
      vendor.value = [...vendors.value];
      category.value = [...categories.value];
    }
    function setLocale(value) {
      locale.value = value;
      document.documentElement.lang = value === 'zh' ? 'zh-Hant' : 'en';
      document.title = t('pageTitle');
    }
    function heatStyle(value, key) {
      if (value === null) return {};
      const { min, max } = ranges.value[key];
      const ratio = max > min ? (value - min) / (max - min) : 0;
      const low = [230, 245, 237];
      const middle = [255, 243, 203];
      const high = [249, 193, 187];
      const start = ratio < 0.5 ? low : middle;
      const end = ratio < 0.5 ? middle : high;
      const fraction = ratio < 0.5 ? ratio * 2 : (ratio - 0.5) * 2;
      return { backgroundColor: `rgb(${start.map((channel, index) => Math.round(channel + (end[index] - channel) * fraction)).join(', ')})` };
    }
    function vendorColor(name) {
      const palette = ['#168466', '#d77740', '#3279b2', '#a85984', '#7d7840', '#69727b'];
      return palette[vendors.value.indexOf(name) % palette.length];
    }
    async function loadModels() {
      loading.value = true;
      errorType.value = '';
      errorDetail.value = '';
      try {
        const response = await fetch('./models.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!Array.isArray(data) || data.some(row => !row || typeof row !== 'object' || typeof row.model !== 'string' || typeof row.vendor !== 'string')) {
          throw new Error(t('invalidData'));
        }
        rows.value = data.map((row, id) => ({
          ...row, id,
          searchText: row.model.toLocaleLowerCase(),
          prices: Object.fromEntries(priceKeys.map(key => [key, parsePrice(row[key])]))
        }));
        reset();
      } catch (cause) {
        errorType.value = location.protocol === 'file:' ? 'fileProtocolError' : 'fetchError';
        errorDetail.value = cause.message;
      } finally {
        loading.value = false;
      }
    }
    onMounted(() => {
      setLocale(locale.value);
      loadModels();
    });
    return { locale, t, setLocale, columns, priceKeys, rows, query, vendor, category, sortKey, sortDirection, loading, error, vendors, categories, modelCount, hasFilters, filteredRows, display, tierNote, sortBy, reset, heatStyle, vendorColor, loadModels };
  }
}).mount('#app');
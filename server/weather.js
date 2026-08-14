/**
 * 天气工具模块 — 封装 Open-Meteo API 调用
 * 提供 getWeatherTool 函数供 Function Calling 使用
 */

// ---------------- WMO 天气码 → 中文描述映射 ----------------
const WEATHER_CODE_MAP = {
  0: "晴",
  1: "大部晴朗",
  2: "多云",
  3: "阴天",
  45: "雾",
  48: "雾凇",
  51: "小毛毛雨",
  53: "中毛毛雨",
  55: "大毛毛雨",
  61: "小雨",
  63: "中雨",
  65: "大雨",
  66: "冻雨（轻）",
  67: "冻雨（大）",
  71: "小雪",
  73: "中雪",
  75: "大雪",
  77: "雪粒",
  80: "阵雨（轻）",
  81: "阵雨（中）",
  82: "阵雨（强）",
  85: "阵雪（轻）",
  86: "阵雪（强）",
  95: "雷暴",
  96: "雷暴伴小冰雹",
  99: "雷暴伴大冰雹",
};

/**
 * 将 WMO 天气码转为中文描述
 * @param {number} code - WMO weather_code
 * @returns {string} 中文天气描述
 */
function getWeatherDescription(code) {
  return WEATHER_CODE_MAP[code] || `未知天气(${code})`;
}

// ---------------- Open-Meteo Geocoding API ----------------
const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";

/**
 * 将城市名转为经纬度
 * @param {string} location - 城市名称（中文或英文）
 * @returns {Promise<{latitude: number, longitude: number, name: string}>}
 */
async function geocodeCity(location) {
  const url = `${GEOCODING_URL}?name=${encodeURIComponent(location)}&count=1&language=zh`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`地理编码 API 请求失败: ${response.status}`);
  }
  const data = await response.json();
  if (!data.results || data.results.length === 0) {
    throw new Error(`找不到城市: ${location}`);
  }
  const { latitude, longitude, name } = data.results[0];
  return { latitude, longitude, name };
}

// ---------------- Open-Meteo Forecast API ----------------
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

/**
 * 获取实时天气和预报
 * @param {number} latitude - 纬度
 * @param {number} longitude - 经度
 * @param {number} forecastDays - 预报天数（0 表示仅实时）
 * @returns {Promise<object>} 天气数据
 */
async function fetchWeather(latitude, longitude, forecastDays) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m",
    timezone: "Asia/Shanghai",
  });

  if (forecastDays > 0) {
    params.set("daily", "weather_code,temperature_2m_max,temperature_2m_min");
    params.set("forecast_days", String(Math.min(forecastDays, 7)));
  }

  const url = `${FORECAST_URL}?${params.toString()}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`天气 API 请求失败: ${response.status}`);
  }
  return response.json();
}

/**
 * 格式化天气数据为 LLM 可读的文本
 * @param {object} weatherData - Open-Meteo 返回的原始数据
 * @param {string} cityName - 城市名称
 * @param {number} forecastDays - 预报天数
 * @returns {string} 格式化的天气描述
 */
function formatWeatherData(weatherData, cityName, forecastDays) {
  const parts = [`【${cityName}实时天气】`];

  if (weatherData.current) {
    const { temperature_2m, relative_humidity_2m, weather_code, wind_speed_10m } =
      weatherData.current;
    parts.push(
      `天气: ${getWeatherDescription(weather_code)}`,
      `温度: ${temperature_2m}°C`,
      `湿度: ${relative_humidity_2m}%`,
      `风速: ${wind_speed_10m} km/h`
    );
  }

  if (forecastDays > 0 && weatherData.daily) {
    parts.push(`\n【未来${forecastDays}天预报】`);
    const { time, weather_code, temperature_2m_max, temperature_2m_min } =
      weatherData.daily;
    for (let i = 0; i < time.length; i++) {
      parts.push(
        `${time[i]}: ${getWeatherDescription(weather_code[i])}, ${temperature_2m_min[i]}°C ~ ${temperature_2m_max[i]}°C`
      );
    }
  }

  return parts.join("\n");
}

// ---------------- 统一入口 ----------------

/**
 * get_weather 工具函数 — 供 Function Calling 调用
 * @param {string} location - 城市名称
 * @param {number} [forecastDays=0] - 预报天数
 * @returns {Promise<string>} 格式化的天气信息，或错误描述
 */
async function getWeatherTool(location, forecastDays = 0) {
  try {
    const { latitude, longitude, name } = await geocodeCity(location);
    const weatherData = await fetchWeather(latitude, longitude, forecastDays);
    return formatWeatherData(weatherData, name, forecastDays);
  } catch (error) {
    return `天气查询失败: ${error.message}`;
  }
}

module.exports = { getWeatherTool };

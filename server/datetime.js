/**
 * 日期时间工具模块 — 封装 solarlunar 历法换算
 * 提供 getDatetimeTool 函数供 Function Calling 使用
 * 注：solarlunar@3.x 为 ESM 包，CommonJS 下需取 .default 导出
 */
const solarlunar = require("solarlunar").default;

// ---------------- 参数校验 ----------------

/**
 * 校验并提取换算参数
 * @param {object} params - { year, month, day, lunar }
 * @returns {{year: number, month: number, day: number, lunar: boolean}|null} 完整年月日返回换算参数，全缺省返回 null（当前时刻模式）
 * @throws {Error} 部分缺省或非整数时抛出
 */
function parseConversionParams(params) {
  const { year, month, day } = params;
  const hasAny = year !== undefined || month !== undefined || day !== undefined;
  if (!hasAny) {
    return null;
  }
  const isComplete = [year, month, day].every((v) => Number.isInteger(v));
  if (!isComplete) {
    throw new Error(
      '日期换算需要完整的年、月、日三个整数，例如 {"year": 2026, "month": 10, "day": 12}'
    );
  }
  return { year, month, day, lunar: params.lunar === true };
}

// ---------------- solarlunar 换算封装 ----------------

/**
 * 公历 → 农历
 * @param {number} year - 公历年
 * @param {number} month - 公历月
 * @param {number} day - 公历日
 * @returns {object} solarlunar 换算结果
 */
function solarToLunar(year, month, day) {
  const result = solarlunar.solar2lunar(year, month, day);
  if (result === -1) {
    throw new Error(`无效的公历日期: ${year}年${month}月${day}日（支持 1900-2100 年）`);
  }
  return result;
}

/**
 * 农历 → 公历
 * @param {number} year - 农历年
 * @param {number} month - 农历月
 * @param {number} day - 农历日
 * @returns {object} solarlunar 换算结果（含对应公历与农历信息）
 */
function lunarToSolar(year, month, day) {
  const result = solarlunar.lunar2solar(year, month, day);
  if (result === -1) {
    throw new Error(`无效的农历日期: 农历${year}年${month}月${day}日（支持 1900-2100 年）`);
  }
  return result;
}

// ---------------- 格式化 ----------------

/**
 * 格式化农历详情（农历中文 + 生肖 + 干支 + 节气）
 * @param {object} r - solarlunar solar2lunar 返回结果
 * @returns {string[]} 信息行
 */
function formatLunarDetails(r) {
  const lines = [
    `农历: ${r.yearCn}${r.monthCn}${r.dayCn}`,
    `生肖: ${r.animal}`,
    `干支: ${r.gzYear}年 ${r.gzMonth}月 ${r.gzDay}日`,
  ];
  if (r.isTerm) {
    lines.push(`今日节气: ${r.term}`);
  }
  return lines;
}

/**
 * 格式化当前时刻完整历法信息
 * @param {Date} now - 服务器当前时间
 * @returns {string} 格式化的日期时间描述
 */
function formatCurrentInfo(now) {
  const r = solarToLunar(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const pad = (n) => String(n).padStart(2, "0");
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  return [
    "【当前日期时间】",
    `公历: ${r.cYear}年${r.cMonth}月${r.cDay}日 ${r.ncWeek} ${time}`,
    ...formatLunarDetails(r),
  ].join("\n");
}

/**
 * 格式化公历 → 农历换算结果
 * @param {object} conv - { year, month, day }
 * @returns {string} 格式化的换算描述
 */
function formatSolarToLunar({ year, month, day }) {
  const r = solarToLunar(year, month, day);
  return [`【公历转农历】${year}年${month}月${day}日 ${r.ncWeek}`, ...formatLunarDetails(r)].join(
    "\n"
  );
}

/**
 * 格式化农历 → 公历换算结果
 * @param {object} conv - { year, month, day }
 * @returns {string} 格式化的换算描述
 */
function formatLunarToSolar({ year, month, day }) {
  const r = lunarToSolar(year, month, day);
  return [
    `【农历转公历】农历${r.yearCn}${r.monthCn}${r.dayCn}`,
    `公历: ${r.cYear}年${r.cMonth}月${r.cDay}日 ${r.ncWeek}`,
    `生肖: ${r.animal}`,
    `干支: ${r.gzYear}年 ${r.gzMonth}月 ${r.gzDay}日`,
  ].join("\n");
}

// ---------------- 统一入口 ----------------

/**
 * get_datetime 工具函数 — 供 Function Calling 调用
 * @param {object} [params] - { year, month, day, lunar }；全部省略时返回当前时刻完整历法信息
 * @returns {Promise<string>} 格式化的日期信息，或错误描述
 */
async function getDatetimeTool(params = {}) {
  try {
    const conv = parseConversionParams(params);
    if (conv === null) {
      return formatCurrentInfo(new Date());
    }
    return conv.lunar ? formatLunarToSolar(conv) : formatSolarToLunar(conv);
  } catch (error) {
    return `日期查询失败: ${error.message}`;
  }
}

module.exports = { getDatetimeTool };

const DEFAULT_DELAY = 300;

export function success(data, msg = "请求成功") {
  return { code: 200, msg, data };
}

export function error(msg = "请求失败", code = 500) {
  return { code, msg, data: null };
}

export function delay(ms = DEFAULT_DELAY) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function mockResponse(dataFn, delayMs = DEFAULT_DELAY) {
  await delay(delayMs);
  try {
    const data = typeof dataFn === "function" ? await Promise.resolve(dataFn()) : dataFn;
    return success(data);
  } catch (e) {
    return error(e.message || "请求失败");
  }
}

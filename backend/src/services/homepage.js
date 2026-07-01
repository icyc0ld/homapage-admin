function normalizeUrl(url) {
  let normalized = url.trim();
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `http://${normalized}`;
  }
  return normalized.replace(/\/$/, "");
}

export async function checkHomepageConnection(baseUrl) {
  const start = Date.now();
  const url = `${normalizeUrl(baseUrl)}/api/healthcheck`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        Accept: "text/plain, application/json, */*",
      },
    });

    clearTimeout(timeout);

    const responseTime = Date.now() - start;
    const body = await response.text();

    if (response.status === 400 && body.includes("Host validation failed")) {
      return {
        ok: false,
        status: response.status,
        responseTime,
        error: "host_validation_failed",
        message:
          "目标 homepage 启用了 HOMEPAGE_ALLOWED_HOSTS 主机头校验，请将该管理后台地址加入允许列表，或设置为 *。",
      };
    }

    if (response.status === 200 && body.trim() === "up") {
      return {
        ok: true,
        status: response.status,
        responseTime,
        error: null,
        message: "连接正常",
      };
    }

    return {
      ok: false,
      status: response.status,
      responseTime,
      error: "unexpected_response",
      message: `收到非预期响应：HTTP ${response.status}，内容：${body.slice(0, 200)}`,
    };
  } catch (error) {
    const responseTime = Date.now() - start;
    let message = error.message;
    let errorCode = "connection_error";

    if (error.name === "AbortError") {
      message = "请求超时（10 秒）";
      errorCode = "timeout";
    } else if (error.cause?.code === "ECONNREFUSED") {
      message = "连接被拒绝，请检查地址与端口是否正确";
      errorCode = "connection_refused";
    } else if (error.cause?.code === "ENOTFOUND") {
      message = "无法解析主机名，请检查地址是否正确";
      errorCode = "dns_error";
    }

    return {
      ok: false,
      status: null,
      responseTime,
      error: errorCode,
      message,
    };
  }
}

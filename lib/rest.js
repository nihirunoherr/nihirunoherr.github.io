const RestAPI = (base, version, token) => {
  const result = {
    base: base,
    api: base + "/api/v" + version,
    version: version,
    token: token,  
    async req(method, endpoint, options = {
      headers: {},
      body: undefined,
      mode: "cors",
      authenticated: null
    }) {
      let body = options.body
      const newHeaders = { ...this.headers }
      
      if (typeof(options.body) === "object") {
        body = JSON.stringify(body)
        newHeaders["Content-Type"] = "application/json"
      }
      
      if (options.authenticated !== true && options.authenticated !== false) {
        options.authenticated = newHeaders.token ? true : false
      }

      if (!options.authenticated) {
        delete newHeaders.token
      }
      
      return await window.fetch(this.api + endpoint, {
        method: method,
        body: body,
        headers: Object.assign(newHeaders, options.headers),
        mode: options.mode || "cors"
      })
    },
    async get(endpoint, options) {
      return await this.req("GET", endpoint, options)
    },
    async post(endpoint, options) {
      return await this.req("POST", endpoint, options)
    },
    async put(endpoint, options) {
      return await this.req("PUT", endpoint, options)
    },
    async delete(endpoint, options) {
      return await this.req("DELETE", endpoint, options)
    },
    async patch(endpoint, options) {
      return await this.req("PATCH", endpoint, options)
    }
  };
  if (token) {
    result.headers = {Authorization: token}
  } else {
    result.headers = {}
  }
  return result
}
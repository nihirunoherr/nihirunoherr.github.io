const HookArray = into => {
  return Object.assign(into, {
    unshift(val) {
      const result = Array.prototype.unshift.call(this, val)
      if (this.onUpdate) {
        this.onUpdate(this, val)
      }
      return result
    }
  })
}
const Queue = (array, maxLength) => {
  const instance = {
    maxLength: maxLength,
    push: function(what) {
      if (this.array.length === maxLength) {
        this.array.unshift(what)
        this.array.splice(maxLength-1, 1)
      } else {
        this.array.unshift(what)
      }
      if (this.onUpdate) {
        this.onUpdate(this, "push", what)
      }
      return this
    },
    set: function(what) {
      this.array = what.slice(0, maxLength)
      if (this.onUpdate) {
        this.onUpdate(this, "set", what)
      }
      return this
    },
    onUpdate: null
  }
  return instance.set(array)
} // deprecated not in use
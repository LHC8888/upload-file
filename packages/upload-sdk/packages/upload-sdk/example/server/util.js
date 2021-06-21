function getDate() {
  const datetime = new Date()
  return `${datetime.getFullYear()}${datetime.getMonth() + 1}${datetime.getDate()}`
}

module.exports = {
  getDate
}
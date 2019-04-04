module.exports = function(instance) {
  const internalRoles = ['seneca', 'transport', 'options']

  const ignore = p => {
    return internalRoles.indexOf(p.role) === -1
  }

  return instance.list().filter(ignore)
}

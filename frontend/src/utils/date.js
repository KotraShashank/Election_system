export const formatDate = value => new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })

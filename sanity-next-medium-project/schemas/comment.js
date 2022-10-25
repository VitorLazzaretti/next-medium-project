export default {
  name: 'comment',
  type: 'document',
  title: 'Comment',
  fields: [
    {
      name: 'name',
      type: 'string',
    },
    {
      name: 'email',
      type: 'string',
    },
    {
      name: "comment",
      type: "text"
    },
    {
      name: "post",
      type: "reference",
      to: [{ type: "post" }]
    }

  ]
}

module.exports = {
    printer_brand_id:
    {
        in: ["body"],
        isInt: {
            errorMessage: 'The value printer_group_id must be an interger.',
            options: { min: 1, max: 100000 },
        },
    },
    label:
    {
        in: ["body"],
        isString: true,
        isLength: {
            errorMessage: 'Field "label" must be at least 6 chars long and max 32.',
            options: { min: 6, max: 32  }
        }
    },
}

module.exports = {
    printer_model_id:
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
            errorMessage: 'Field "label" must be at least 2 chars long and max 32.',
            options: { min: 2, max: 32  }
        }
    },
    z_displacement:
    {
        in: ["body"],
        isFloat: {
            errorMessage: 'The value printer_group_id must be an interger.',
        },
    }
}
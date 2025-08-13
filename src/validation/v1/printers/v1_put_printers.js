
module.exports = {
    label:
    {
        in: ["body"],
        isString: true,
        optional: {
            options: {
             nullable: true,
            }
        },
        isLength: {
            errorMessage: 'Field "label" must be at least 6 chars long and max 32.',
            options: { min: 6, max: 32  }
        }
    },
    z_displacement:
    {
        in: ["body"],
        optional: {
            options: {
             nullable: true,
            }
        },
        isFloat: {
            errorMessage: 'The value printer_group_id must be an interger.',
        },
    }
}
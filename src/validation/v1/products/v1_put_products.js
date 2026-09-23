
module.exports = {
    included_items:
    {
        in: ["body"],
        isString: true,
        isLength: {
            errorMessage: 'Field "included_items" must be at least 2 chars long and max 512.',
            options: { min: 0, max: 512 }
        },
        optional: {
            options: {
             nullable: true,
            }
        },
    },
    print_time:
    {
        in: ["body"],
        isTime: {
            errorMessage: 'The value printer_group_id must be an interger.',
            hourFormat: "hour24"
        },
        optional: {
            options: {
             nullable: true,
            }
        },
    },
    weight_gross:
    {
        in: ["body"],
        isFloat: {
            errorMessage: 'The value printer_group_id must be an interger.',
        },
        optional: {
            options: {
             nullable: true,
            }
        },
    },
    weight_net:
    {
        in: ["body"],
        isFloat: {
            errorMessage: 'The value printer_group_id must be an interger.',
        },
        optional: {
            options: {
             nullable: true,
            }
        },
    },
}
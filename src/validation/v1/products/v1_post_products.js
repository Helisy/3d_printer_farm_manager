
module.exports = {
    printer_model_id:
    {
        in: ["body"],
        isInt: {
            errorMessage: 'The value printer_model_id must be an interger.',
            options: { min: 1, max: 100000 },
        },
    },
    filament_brand_id:
    {
        in: ["body"],
        isInt: {
            errorMessage: 'The value filament_brand_id must be an interger.',
            options: { min: 1, max: 100000 },
        },
    },
    filament_material_id:
    {
        in: ["body"],
        isInt: {
            errorMessage: 'The value filament_material_id must be an interger.',
            options: { min: 1, max: 100000 },
        },
    },
    sku:
    {
        in: ["body"],
        isString: true,
        isLength: {
            errorMessage: 'Field "sku" must be at least 6 chars long and max 32.',
            options: { min: 6, max: 32  }
        }
    },
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
    },
    weight_gross:
    {
        in: ["body"],
        isFloat: {
            errorMessage: 'The value printer_group_id must be an interger.',
        },
    },
    weight_net:
    {
        in: ["body"],
        isFloat: {
            errorMessage: 'The value printer_group_id must be an interger.',
        },
    },
    quantity:
    {
        in: ["body"],
        isInt: {
            errorMessage: 'The value filament_material_id must be an interger.',
            options: { min: 1, max: 50 },
        },
    },
}
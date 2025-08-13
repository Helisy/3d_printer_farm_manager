const { filament_brand_id } = require("./v1_post_printers_filaments");

module.exports = {
    printer_id:
    {
        in: ["body"],
        isInt: {
            errorMessage: 'The value printer_id must be an interger.',
            options: { min: 1, max: 100000 },
        },
    },
    filament_id:
    {
        in: ["body"],
        isInt: {
            errorMessage: 'The filament_id printer_id must be an interger.',
            options: { min: 1, max: 100000 },
        },
    },
    entry_quantity:
    {
        in: ["body"],
        isFloat: {
            errorMessage: 'The value entry_quantity must be an interger.',
            options: { min: 0, max: 100000 },
        },
    },
    current_quantity:
    {
        in: ["body"],
        isFloat: {
            errorMessage: 'The value current_quantity must be an interger.',
            options: { min: 0, max: 100000 },
        },
    },
}
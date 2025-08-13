const { filament_brand_id } = require("./v1_post_printers_filaments");

module.exports = {
    current_quantity:
    {
        in: ["body"],
        isFloat: {
            errorMessage: 'The value current_quantity must be an interger.',
            options: { min: 0, max: 100000 },
        },
    },
}
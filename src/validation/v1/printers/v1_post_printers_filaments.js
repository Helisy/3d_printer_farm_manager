
module.exports = {
    filament_brand_id:
    {
        in: ["body"],
        isInt: {
            errorMessage: 'The value filament_brand_id must be an interger.',
            options: { min: 1, max: 100000 },
        },
    },
    material_id:
    {
        in: ["body"],
        isInt: {
            errorMessage: 'The value material_id must be an interger.',
            options: { min: 1, max: 100000 },
        },
    },
    color:
    {
        in: ["body"],
        isString: true,
        isLength: {
            errorMessage: 'Field "color" must be at least 3 chars long and max 32.',
            options: { min: 3, max: 32  }
        }
    }
}
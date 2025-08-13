
module.exports = {
    label:
    {
        in: ["body"],
        isString: true,
        isLength: {
            errorMessage: 'Field "filament_brand_id" must be at least 3 chars long and max 32.',
            options: { min: 3, max: 32  }
        }
    }
}
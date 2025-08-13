module.exports = {
    value: {
        in: ["body"],
        isLength: {
            options: { min: 1, max: 32 },
            errorMessage: 'The value values must be at max 32 characters.',
        },
    }
}
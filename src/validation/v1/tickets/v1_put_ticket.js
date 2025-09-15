module.exports = {
    description:
    {
        in: ["body"],
        isString: true,
        isLength: {
            errorMessage: 'Field "description" must be at least 1 chars long and max 5000.',
            options: { min: 1, max: 5000  }
        }
    }
}
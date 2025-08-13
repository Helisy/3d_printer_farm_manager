
module.exports = {
    label: {
        in: ['body'],
        isString: true,
        isLength: {
            errorMessage: 'Field "label" must be at least 3 chars long and max 32.',
            options: { min: 3, max: 32  }
        }
    },
}
module.exports = {
    values: {
        in: ["body"],
        isArray: {
            bail:true,
            options: { min: 1 },
            errorMessage: 'The field label values be an array and can not be empty.',
        },
    },
    "values.*": {
        in: ["body"],  
        isObject: {
            options: { strict: true },
            errorMessage: 'The array values must contain only objects.',
        },
    },
    "values.*.value_id": {
        in: ["body"],
        isInt: {
            errorMessage: 'The field "value_id" must be an interger.',
            options: { min: 1, max: 10 },
        },
    },
    "values.*.value": {
        in: ["body"],
        isLength: {
            options: { min: 1, max: 32 },
            errorMessage: 'The field "value" must be at max 32 characters.',
        },
    }
}
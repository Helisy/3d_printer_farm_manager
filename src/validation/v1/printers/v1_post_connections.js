
module.exports = {
    printer_id:
    {
        in: ["body"],
        isInt: {
            errorMessage: 'The value printer_group_id must be an interger.',
            options: { min: 1, max: 100000 },
        }
    }
}
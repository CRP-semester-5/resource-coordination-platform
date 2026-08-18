export const validate = (schema, source = "body") => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[source], {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            return res.status(400).json({
                success: false,
                message: "Validation failed.",
                errors: error.details.map((detail) => detail.message),
            });
        }

        req[source] = value;
        next();
    };
};


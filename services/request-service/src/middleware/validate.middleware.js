export const validate = (schema, property = "body") => {
    return (req, res, next) => {
         try {
            const { error, value } = schema.validate(req[property], {
                abortEarly: false,
                allowUnknown: false,
                stripUnknown: true,
            });

            if (error) {
                return res.status(400).json({
                    success: false,
                    message: "Validation failed.",
                    errors: error.details.map((detail) => ({
                        field: detail.path.join("."),
                        message: detail.message,
                    })),
                });
            }

            // Replace request data with validated/sanitized data
            req[property] = value;

            next();
        } catch (err) {
            return res.status(500).json({
                success: false,
                message: "Validation middleware error.",
                error: err.message,
            });
        }
    };
};
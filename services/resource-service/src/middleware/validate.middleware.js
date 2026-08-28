export const validate = (schema) => {

    return (req,res,next)=>{

        const {error} =
            schema.validate(req.body);
        if(error){ console.error('Validation Error:', error.details[0].message, req.body);

            return res.status(400).json({
                success:false,
                message:error.details[0].message
            });

        }
        next();

    };

};

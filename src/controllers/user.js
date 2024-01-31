import {asyncHandler} from "../utils/AsyncHandler.js"

const RegisterUser=asyncHandler( async (req,res)=>{
    res.status(200).json({
        message:"Ok"
    })
});
//http://localhost:8000/api/v1/users/register
export default RegisterUser;
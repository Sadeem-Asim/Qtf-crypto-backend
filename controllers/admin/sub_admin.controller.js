import { UserModel } from "#models/user.model";
import { subAdminUsers } from "#models/sub_admin_users";
import asyncHandlerMiddleware from "#middlewares/asyncHandler.middleware";

/**
 @desc     GET All Sub admins
 @route    GET /api/admin/sub_admins
 @access   Private (Admin)
 */
const getAllSubAdmin = asyncHandlerMiddleware(async (req, res) => {
  const subAdmins = await UserModel.aggregate([
    {
      $lookup: {
        from: "sub_admins",
        localField: "_id",
        foreignField: "sub_admin",
        as: "data",
      },
    },
    { $unwind: "$data" },
    {
      $project: {
        users_info: { $size: { $ifNull: ["$data.users", []] } },
        users: "$data.users",
        name: 1,
        email: 1,
        role: 1,
      },
    },
  ]);
  //   console.log(subAdmins);
  res.status(200).send(subAdmins);
});

/**
 @desc     Delete Sub admin
 @route    GET /api/admin/delete/sub_admin/:id
 @access   Private (Admin)
 */
const deleteSubAdmin = asyncHandlerMiddleware(async (req, res) => {
  const { id } = req.params;
  console.log(id);
  const record = await UserModel.findByIdAndDelete(id);

  if (record) return res.status(200).send("Successfully Deleted");

  res.status(400).send("User not found");
});

/**
 @desc     PUT Assign User to Sub admins
 @route    PUT /api/admin/sub_admins
 @access   Private (Admin)
 */
const assignUsers = asyncHandlerMiddleware(async (req, res) => {
  const { sub_admin, users } = req.body;
  console.log(req.body, "DDDDDDD");
  console.log(sub_admin, users);
  // const user = await UserModel.find({ _id : req.body?.user_id, role : "USER" , isAssign : false});
  //const playlistsTrack = await Playlist.findOne({_id:req.body?.playlistId,trackId : { $in : req.body?.trackId}}).select("-__v");

  // const validUserAssign = await subAdminUsers.findOne({user_id : {$in :  req.body.user_id}})

  // if (validUserAssign) return res.status(200).send('User assign already')

  // const update = await subAdminUsers.findOneAndUpdate({sub_admin_id: req.body.sub_admin_id}, {user_id: req.body?.user_id})
  const update = await subAdminUsers.findOneAndUpdate(
    { sub_admin },
    { users },
    { new: true }
  );

  console.log({ update });

  if (!update) return res.status(400).send("Something went wrong");

  res.status(200).send("User assign to sub_admin successfully");
});
export { getAllSubAdmin, assignUsers, deleteSubAdmin };

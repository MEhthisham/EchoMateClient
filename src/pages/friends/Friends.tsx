import { useAppDispatch, useAppSelector } from "src/redux/hooks";
import "./friends.css";
import { setSnack } from "src/redux/reducers/snack.reducer";
export default function Friends() {
  const dispatch = useAppDispatch();
  const { user, socket } = useAppSelector((state) => ({
    user: state.auth.user,
    socket: state.socket.socket,
  }));
  return (
    <div className="container">
      <h1 className="fw-light text-center text-lg-start mt-4 mb-0">Friends</h1>

      <hr className="mt-2 mb-5" />

      <div className="row text-center text-lg-start">
        {user?.requests.map((request) => (
          <div key={request._id} className="col-lg-3 col-md-4 col-6">
            <a href="#" className="d-block mb-4 h-100">
              <img
                className="img-fluid img-thumbnail"
                src="https://source.unsplash.com/pWkk7iiCoDM/400x300"
                alt=""
              />
            </a>
            <button
              onClick={() => {
                const obj = {
                  receiver: user?._id,
                  sender: request._id,
                };
                socket?.emit("accept-friend-request", obj);
                dispatch(
                  setSnack({
                    open: true,
                    message: "Friend request accepted",
                    type: "success",
                  })
                );
              }}
              className="form-control mb-2"
            >
              Accept
            </button>
            <button
              onClick={() => {
                const obj = {
                  receiver: user?._id,
                  sender: request._id,
                };
                socket?.emit("reject-friend-request", obj);
                dispatch(
                  setSnack({
                    open: true,
                    message: "Friend request rejected",
                    type: "error",
                  })
                );
              }}
              className="form-control"
            >
              Reject
            </button>
          </div>
        ))}
        {user?.friends.map((friend) => (
          <div key={friend._id} className="col-lg-3 col-md-4 col-6">
            <a href="#" className="d-block mb-4 h-20 border">
              <img
                className="img-fluid img-thumbnail"
                src={
                  friend.photoURL ||
                  "https://source.unsplash.com/pWkk7iiCoDM/400x300"
                }
                alt=""
              />
            </a>
            <h6>{friend.displayName}</h6>
            <button
              onClick={() => {
                socket?.emit("unfriend-user", {
                  receiver: user?._id,
                  sender: friend._id,
                });
              }}
              className="form-control"
            >
              unfriend
            </button>
            
          </div>
        ))}
      </div>
    </div>
  );
}

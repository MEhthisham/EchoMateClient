/* eslint-disable @typescript-eslint/no-explicit-any */
import Page from "components/Page";
import "./chat.css";
import { setSnack } from "src/redux/reducers/snack.reducer";
import axios from "axios";
import { useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "src/redux/hooks";
import { useNavigate } from "react-router-dom";
import { get, uniqBy } from "lodash";
import { Icon } from "@iconify/react";
import { ChatType } from "utils/types/chat.types";
import { Modal } from "react-bootstrap";

export default function Chat() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [activeUser, setActiveUser] = useState("");
  const [showMediaDialog, setShowMediaDialog] = useState(false);
  const { user, socket, chats } = useAppSelector((state) => ({
    user: state.auth.user,
    chats: state.chats.chats,
    socket: state.socket.socket,
  }));

  const [chatMessage, setChatMessage] = useState("");
  const [media, setMedia] = useState<any>(null);

  const handleActiveUser = async (email: string) => {
    setActiveUser(email);
    navigate(`/chat?selected=${email}`);
    if (socket) {
      socket.emit("get-messages-request", {
        sender: user?.email,
        receiver: email,
      });
    }
  };

  function convertFileToDataURL(file: any) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  }

  async function handleChatMessage(data: any) {
    let chatObj: any = {
      sender: user?.email,
      receiver: activeUser,
      message: data,
      type: "text",
    };
    if (media) {
      chatObj = {
        ...chatObj,
        media: {
          type: media?.type,
          file: media?.file,
          name: media?.file?.name,
        },
        type: media?.type?.includes("image")
          ? "image"
          : media?.type?.includes("video")
          ? "video"
          : "text",
      };
      try {
        const formData = new FormData();
        formData.append("file", media.file);
        const backendServer = `${import.meta.env.VITE_express_server}`;
        const { data } = await axios.post(`${backendServer}/upload`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        chatObj = {
          ...chatObj,
          type: media.type,
          media: data.fileUrl,
        };
      } catch (error: any) {
        dispatch(
          setSnack({ type: "error", message: error.message, open: true })
        );
      }
    }
    socket?.emit("send-message-request", chatObj);
    setChatMessage("");
    setShowMediaDialog(false);
    setMedia(null);
  }
  return (
    <Page title="chat">
      <Modal
        maxWidth="sm"
        fullWidth
        show={showMediaDialog}
        onHide={() => {
          setShowMediaDialog(false);
          setMedia(null);
        }}
      >
        <Modal.Header>
          <Modal.Title>Upload media</Modal.Title>
        </Modal.Header>
        {media && (
          <>
            {media.type.includes("image") ? (
              <img src={media.url} width="100%" height={300} />
            ) : (
              <video src={media.url} width="100%" height={300} controls></video>
            )}
          </>
        )}
        <input
          className="form-control p-3"
          id="textAreaExample2"
          value={chatMessage}
          onChange={(e) => setChatMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleChatMessage(get(e, "target.value", ""));
            }
          }}
          placeholder="Type a message"
        />
      </Modal>
      <div className="container py-5 px-4">
        <header className="text-center">
          <h1 className="display-4 text-black mb-3">Chat with your friends</h1>
        </header>

        <div className="row rounded-lg overflow-hidden shadow">
          <div className="col-5 px-0">
            <div className="bg-white">
              <div className="messages-box">
                <div className="list-group rounded-0">
                  {user?.friends.map((friend) => (
                    <div
                      key={friend._id}
                      onClick={() => handleActiveUser(friend.email)}
                      className="list-group-item list-group-item-action text-black rounded-0"
                    >
                      <div className="media" style={{ alignItems: "center" }}>
                        <img
                          src={friend.photoURL}
                          alt="user"
                          width="50"
                          style={{ borderRadius: "50px" }}
                        />
                        <div className="media-body ml-4">
                          <div className="">
                            <h6 className="mb-0">{friend.displayName}</h6>
                            <p className="mb-0">{friend.email}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="col-7 px-0">
            <div className="px-4 py-5 chat-box bg-white">
              {uniqBy(chats, "_id").map((chat: ChatType) =>
                chat.sender === user?.email ? (
                  <div className="media w-50 mb-3">
                    <img
                      src={user?.photoURL}
                      alt="user"
                      width="50"
                      style={{
                        borderRadius: "50px",
                      }}
                    />
                    <div className="media-body ml-3">
                      <div className="bg-light rounded py-2 px-3 mb-2">
                        <p className="text-small mb-0 text-muted">
                          {chat.message}
                        </p>
                        {chat.media && chat.type.includes("image") && (
                          <img
                            style={{
                              width: 200,
                              height: 200,
                              objectFit: "cover",
                              borderRadius: 8,
                              minWidth: 200,
                              minHeight: 200
                            }}
                            src={chat.media}
                            alt={chat.message}
                          />
                        )}
                        {chat.media && chat.type.includes("video") && (
                          <video
                            style={{
                              width: 200,
                              height: 200,
                              minWidth: 200,
                              minHeight: 200,
                              objectFit: "cover",
                              borderRadius: 8,
                            }}
                            controls
                            src={chat.media}
                          />
                        )}
                      </div>
                      <p className="small text-muted">12:02 PM | 22 Dec</p>
                    </div>
                  </div>
                ) : (
                  <div className="media w-50 ml-auto mb-3">
                    <img
                      src={user?.friends.find(friend => friend.email === chat.sender)?.photoURL}
                      alt="user"
                      width="50"
                      style={{
                        borderRadius: "50px",
                      }}
                    />
                    <div className="media-body">
                      <div className="bg-primary rounded py-2 px-3 mb-2">
                        <p className="text-small mb-0 text-white">
                          {chat.message}
                        </p>
                        {chat.media && chat.type.includes("image") && (
                          <img
                            style={{
                              width: 200,
                              height: 200,
                              minWidth: 200,
                              minHeight: 200,
                              objectFit: "cover",
                              borderRadius: 8,
                            }}
                            src={chat.media}
                            alt={chat.message}
                          />
                        )}
                        {chat.media && chat.type.includes("video") && (
                          <video
                            style={{
                              width: 200,
                              height: 200,
                              minWidth: 200,
                              minHeight: 200,
                              objectFit: "cover",
                              borderRadius: 8,
                            }}
                            controls
                            src={chat.media}
                          />
                        )}
                      </div>
                      <p className="small text-muted">12:01 PM | 22 Dec</p>
                    </div>
                  </div>
                )
              )}
            </div>

            <form action="#" className="bg-light">
              <div className="form-outline">
                <input
                  type="file"
                  ref={photoInputRef}
                  accept="image/*"
                  style={{ display: "none" }}
                  id="image"
                  onChange={async (e) => {
                    const file: any = get(e, "target.files[0]", null);
                    if (file) {
                      const url = await convertFileToDataURL(file);
                      setMedia({
                        url,
                        type: file.type,
                        file,
                      });
                      setShowMediaDialog(true);
                    }
                  }}
                />
                <input
                  type="file"
                  ref={videoInputRef}
                  accept="video/*"
                  style={{ display: "none" }}
                  id="video"
                  onChange={async (e) => {
                    const file: any = get(e, "target.files[0]", null);
                    try {
                      if (file) {
                        const url = await convertFileToDataURL(file);
                        setMedia({
                          url,
                          type: file.type,
                          file,
                        });
                        setShowMediaDialog(true);
                      }
                    } catch (error: any) {
                      console.log(error.message);
                    }
                  }}
                  onAbort={(e) => {
                    console.log(e);
                  }}
                />
                <div className="d-flex mb-2">
                  <button
                    className="border-0"
                    onClick={() => videoInputRef.current?.click()}
                  >
                    <Icon style={{ fontSize: 24 }} icon="mingcute:video-fill" />
                  </button>
                  <button
                    className="border-0 ms-2"
                    onClick={() => photoInputRef.current?.click()}
                  >
                    <Icon style={{ fontSize: 24 }} icon="ic:outline-image" />
                  </button>
                </div>
                <input
                  className="form-control p-3"
                  id="textAreaExample2"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleChatMessage(get(e, "target.value", ""));
                    }
                  }}
                  placeholder="Type a message"
                />
              </div>
            </form>
          </div>
        </div>
      </div>
    </Page>
  );
}

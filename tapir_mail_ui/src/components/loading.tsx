import React from "react";
import { FadeLoader } from "react-spinners";

const Loading = () => {
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        justifyContent: "center",
        marginTop: "1em",
      }}
    >
      <FadeLoader
        color="#36d7b7"
        radius={80}
      />
    </div>
  );
};

export default Loading;

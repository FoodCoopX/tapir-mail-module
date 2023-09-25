import { render, screen, within } from "@testing-library/react";

import StoredUploadsCard from "../StoredUploadsCard";
import { MediaLibraryApi, StoredUpload } from "../../../api_client";
import React from "react";
import userEvent from "@testing-library/user-event";

jest.mock("../../../api_client/apis/MediaLibraryApi");

describe("StoredUploadsCard", () => {
  const upload1: StoredUpload = {
    uploadId: "upload1Id",
    stored: new Date("2023-12-09T03:24:00"),
    uploaded: new Date("2023-11-09T03:24:00"),
    uploadedBy: 10,
    file: "upload1File.txt",
    fileName: "upload1FileName",
  };
  const upload2: StoredUpload = {
    uploadId: "upload2Id",
    stored: new Date("2022-12-09T03:24:00"),
    uploaded: new Date("2022-11-09T03:24:00"),
    uploadedBy: 20,
    file: "upload2File.doc",
    fileName: "upload2FileName",
  };
  const uploadImage: StoredUpload = {
    uploadId: "upload3Id",
    stored: new Date("2022-12-09T03:24:00"),
    uploaded: new Date("2022-11-09T03:24:00"),
    uploadedBy: 30,
    file: "upload3File",
    fileName: "upload3FileName.png",
  };

  test("Stored upload list gets rendered", () => {
    let storedUploads: StoredUpload[] = [upload1, upload2];

    render(
      <StoredUploadsCard
        storedUploads={storedUploads}
        updateStoredUploadsList={() => null}
        apiClient={new MediaLibraryApi()}
      />,
    );

    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(3);

    const cells_of_first_row = rows[1].getElementsByTagName("td");
    expect(cells_of_first_row[0]).toHaveTextContent("#1");
    expect(cells_of_first_row[1]).toHaveTextContent("No preview available");
    expect(cells_of_first_row[2]).toHaveTextContent(upload1.fileName);
    expect(cells_of_first_row[3]).toHaveTextContent(
      "api/media_library/get_file/" + upload1.uploadId,
    );
    expect(cells_of_first_row[4]).toHaveTextContent(upload1.uploadId);
    expect(cells_of_first_row[5]).toHaveTextContent("Thu Nov 09 2023 03:24:00");
    expect(cells_of_first_row[6]).toHaveTextContent("Sat Dec 09 2023 03:24:00");

    const cells_of_second_row = rows[2].getElementsByTagName("td");
    expect(cells_of_second_row[0]).toHaveTextContent("#2");
    expect(cells_of_second_row[1]).toHaveTextContent("No preview available");
    expect(cells_of_second_row[2]).toHaveTextContent(upload2.fileName);
    expect(cells_of_second_row[3]).toHaveTextContent(
      "api/media_library/get_file/" + upload2.uploadId,
    );
    expect(cells_of_second_row[4]).toHaveTextContent(upload2.uploadId);
    expect(cells_of_second_row[5]).toHaveTextContent(
      "Wed Nov 09 2022 03:24:00",
    );
    expect(cells_of_second_row[6]).toHaveTextContent(
      "Fri Dec 09 2022 03:24:00",
    );
  });

  test("Image files get previewed", () => {
    let storedUploads: StoredUpload[] = [uploadImage];

    render(
      <StoredUploadsCard
        storedUploads={storedUploads}
        updateStoredUploadsList={() => null}
        apiClient={new MediaLibraryApi()}
      />,
    );

    const image: HTMLImageElement = within(screen.getByRole("table")).getByRole(
      "img",
    );
    expect(image).toBeInTheDocument();

    expect(image).toHaveAttribute(
      "src",
      expect.stringContaining(
        "api/media_library/get_file/" + uploadImage.uploadId,
      ),
    );
  });

  test("Delete button calls API", async () => {
    let storedUploads: StoredUpload[] = [upload1];

    const mock_api_client = new MediaLibraryApi();
    mock_api_client.storeduploadsDestroy = jest
      .fn()
      .mockImplementationOnce(() => Promise.resolve());

    const mock_update_list = jest.fn();

    render(
      <StoredUploadsCard
        storedUploads={storedUploads}
        updateStoredUploadsList={mock_update_list}
        apiClient={mock_api_client}
      />,
    );

    await userEvent.click(screen.getByRole("button"));

    expect(mock_api_client.storeduploadsDestroy).toHaveBeenCalledTimes(1);
    expect(mock_api_client.storeduploadsDestroy).toHaveBeenCalledWith({
      uploadId: upload1.uploadId,
    });
    expect(mock_update_list).toHaveBeenCalledTimes(1);
  });
});

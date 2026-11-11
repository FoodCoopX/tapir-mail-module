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
        itemCount={storedUploads.length}
        currentPage={0}
        goToPage={() => null}
        searchTerm=""
        onSearchTermChange={() => null}
      />,
    );

    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(3);

    const cells_of_first_row = rows[1].getElementsByTagName("td");
    expect(cells_of_first_row[0]).toHaveTextContent("DATEI");
    expect(within(cells_of_first_row[1]).getByRole("link")).toHaveAttribute(
      "href",
      expect.stringContaining("api/media_library/get_file/" + upload1.uploadId),
    );
    expect(cells_of_first_row[1]).toHaveTextContent(upload1.fileName);
    expect(cells_of_first_row[3]).toHaveTextContent("09.12.23, 03:24");
    expect(cells_of_first_row[4]).toHaveTextContent("10");

    const cells_of_second_row = rows[2].getElementsByTagName("td");
    expect(cells_of_second_row[0]).toHaveTextContent("DATEI");
    expect(cells_of_second_row[1]).toHaveTextContent(upload2.fileName);
    expect(cells_of_second_row[3]).toHaveTextContent("09.12.22, 03:24");
    expect(cells_of_second_row[4]).toHaveTextContent("20");
  });

  test("Image files get previewed", () => {
    let storedUploads: StoredUpload[] = [uploadImage];

    render(
      <StoredUploadsCard
        storedUploads={storedUploads}
        updateStoredUploadsList={() => null}
        apiClient={new MediaLibraryApi()}
        itemCount={storedUploads.length}
        currentPage={0}
        goToPage={() => null}
        searchTerm=""
        onSearchTermChange={() => null}
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
    expect(image.closest("a")).toHaveAttribute(
      "href",
      expect.stringContaining(
        "api/media_library/get_file/" + uploadImage.uploadId,
      ),
    );
  });

  test("Delete button calls API after confirmation", async () => {
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
        itemCount={storedUploads.length}
        currentPage={0}
        goToPage={() => null}
        searchTerm=""
        onSearchTermChange={() => null}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Löschen" }));
    expect(mock_api_client.storeduploadsDestroy).not.toHaveBeenCalled();

    await userEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Löschen",
      }),
    );

    expect(mock_api_client.storeduploadsDestroy).toHaveBeenCalledTimes(1);
    expect(mock_api_client.storeduploadsDestroy).toHaveBeenCalledWith({
      uploadId: upload1.uploadId,
    });
    expect(mock_update_list).toHaveBeenCalledTimes(1);
  });

  test("Pagination navigates to the clicked page", async () => {
    const goToPage = jest.fn();

    render(
      <StoredUploadsCard
        storedUploads={[upload1]}
        updateStoredUploadsList={() => null}
        apiClient={new MediaLibraryApi()}
        itemCount={25}
        currentPage={1}
        goToPage={goToPage}
        searchTerm=""
        onSearchTermChange={() => null}
      />,
    );

    await userEvent.click(screen.getByText("3"));
    expect(goToPage).toHaveBeenCalledWith(2);
  });

  test("Cancelling the delete confirmation does not call API", async () => {
    const mock_api_client = new MediaLibraryApi();
    mock_api_client.storeduploadsDestroy = jest.fn();

    render(
      <StoredUploadsCard
        storedUploads={[upload1]}
        updateStoredUploadsList={() => null}
        apiClient={mock_api_client}
        itemCount={1}
        currentPage={0}
        goToPage={() => null}
        searchTerm=""
        onSearchTermChange={() => null}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Löschen" }));
    await userEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Abbrechen",
      }),
    );

    expect(mock_api_client.storeduploadsDestroy).not.toHaveBeenCalled();
  });

  test("Typing in the search field reports the search term", async () => {
    const onSearchTermChange = jest.fn();

    render(
      <StoredUploadsCard
        storedUploads={[upload1]}
        updateStoredUploadsList={() => null}
        apiClient={new MediaLibraryApi()}
        itemCount={1}
        currentPage={0}
        goToPage={() => null}
        searchTerm=""
        onSearchTermChange={onSearchTermChange}
      />,
    );

    await userEvent.type(screen.getByLabelText("Dateiname suchen"), "a");

    expect(onSearchTermChange).toHaveBeenCalledWith("a");
  });

  test("Empty search result shows a message", () => {
    render(
      <StoredUploadsCard
        storedUploads={[]}
        updateStoredUploadsList={() => null}
        apiClient={new MediaLibraryApi()}
        itemCount={0}
        currentPage={0}
        goToPage={() => null}
        searchTerm="unbekannt"
        onSearchTermChange={() => null}
      />,
    );

    expect(screen.getByText("Keine Dateien gefunden")).toBeInTheDocument();
  });
});

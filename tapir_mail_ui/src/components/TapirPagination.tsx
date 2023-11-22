import React from "react";
import { Pagination } from "react-bootstrap";

interface TapirPaginationProps {
  pageSize: number;
  itemCount: number;
  currentPage: number;
  goToPage: (pageIndex: number) => void;
}

const TapirPagination: React.FC<TapirPaginationProps> = ({
  pageSize,
  itemCount,
  currentPage,
  goToPage,
}) => {
  return (
    <Pagination className="mb-0">
      {Array.from(
        { length: Math.ceil(itemCount / pageSize) },
        (_, pageIndex) => (
          <Pagination.Item
            key={pageIndex}
            onClick={() => goToPage(pageIndex)}
            active={currentPage === pageIndex}
          >
            {pageIndex + 1}
          </Pagination.Item>
        ),
      )}
    </Pagination>
  );
};

export default TapirPagination;

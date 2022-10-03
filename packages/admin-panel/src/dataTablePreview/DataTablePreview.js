/*
 * Tupaia
 *  Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { FetchLoader, DataTable } from '@tupaia/ui-components';
import { IdleMessage } from './IdleMessage';

const StyledTable = styled(DataTable)`
  table {
    border-top: 1px solid ${({ theme }) => theme.palette.grey['400']};
    border-bottom: 1px solid ${({ theme }) => theme.palette.grey['400']};
    table-layout: auto;

    thead {
      text-transform: none;
    }
  }
`;

const TableContainer = styled.div`
  display: flex;

  .MuiTableContainer-root {
    overflow: hidden;
  }
`;

const convertValueToPrimitive = val => {
  if (val === null) return val;
  switch (typeof val) {
    case 'object':
      return JSON.stringify(val);
    case 'function':
      return '[Function]';
    default:
      return val;
  }
};

const getColumns = data => {
  const columnKeys = [...new Set(data.map(d => Object.keys(d)).flat())];
  const indexColumn = {
    Header: '#',
    id: 'index',
    accessor: (_row, i) => i + 1,
  };
  const columns = columnKeys.map(columnKey => {
    return {
      Header: columnKey,
      accessor: row => convertValueToPrimitive(row[columnKey]),
    };
  });

  return [indexColumn, ...columns];
};

export const DataTablePreview = ({ showData, isLoading, isError, error, previewData }) => {
  const columns = useMemo(() => getColumns(previewData), [previewData]);
  const data = useMemo(() => previewData, [previewData]);

  return (
    <TableContainer>
      {showData ? (
        <FetchLoader
          isLoading={isLoading}
          isError={isError}
          error={error}
          isNoData={!previewData.length}
          noDataMessage="No Data Found"
        >
          <StyledTable columns={columns} data={data} rowLimit={100} />
        </FetchLoader>
      ) : (
        <IdleMessage />
      )}
    </TableContainer>
  );
};

DataTablePreview.propTypes = {
  showData: PropTypes.bool,
  isLoading: PropTypes.bool,
  isError: PropTypes.bool,
  error: PropTypes.string,
  previewData: PropTypes.arrayOf(PropTypes.object),
};

DataTablePreview.defaultProps = {
  showData: false,
  isLoading: false,
  isError: false,
  error: null,
  previewData: [],
};

/*
 * Copyright (c) 2022 Samsung Electronics Co., Ltd. All Rights Reserved
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* eslint-disable */
let typeName = {
    'ActivationFunctionType': ['NONE', 'RELU', 'RELU_N1_TO_1', 'RELU6', 'TANH', 'SIGN_BIT'],
    'Padding': ['SAME', 'VALID'],
    'LSHProjectionType': ['UNKNOWN', 'SPARSE', 'DENSE'],
    'DimensionType': ['DENSE', 'SPARSE_CSR'],
    'FullyConnectedOptionsWeightsFormat': ['DEFAULT', 'SHUFFLED4x16INT8', 'SHUFFLED16x1FLOAT32'],
    'LSTMKernelType': ['FULL', 'BASIC'],
    'CombinerType': ['SUM', 'MEAN', 'SQRTN'],
    'MirrorPadMode': ['REFLECT', 'SYMMETRIC'],
    'CustomOptionsFormat': ['FLEXBUFFERS'],
    'DataFormat': ['CHANNELS_LAST', 'CHANNELS_FIRST'],
};

let tensorType = [
    'FLOAT32', 'FLOAT16', 'INT32', 'UINT8', 'INT64', 'BOOLEAN', 'INT16', 'INT8', 'FLOAT64',
    'UINT64', 'UINT32'
];

let customType = ['int', 'boolean', 'string'];

let builtinOperatorType = {
    'ADD': 0,
    'AVERAGEPOOL2D': 1,
    'CONCATENATION': 2,
    'CONV2D': 3,
    'DEPTHWISECONV2D': 4,
    'DEPTHTOSPACE': 5,
    'DEQUANTIZE': 6,
    'EMBEDDINGLOOKUP': 7,
    'FLOOR': 8,
    'FULLYCONNECTED': 9,
    'HASHTABLELOOKUP': 10,
    'L2NORMALIZATION': 11,
    'L2POOL2D': 12,
    'LOCALRESPONSENORMALIZATION': 13,
    'LOGISTIC': 14,
    'LSHPROJECTION': 15,
    'LSTM': 16,
    'MAXPOOL2D': 17,
    'MUL': 18,
    'RELU': 19,
    'RELUN1TO1': 20,
    'RELU6': 21,
    'RESHAPE': 22,
    'RESIZEBILINEAR': 23,
    'RNN': 24,
    'SOFTMAX': 25,
    'SPACETODEPTH': 26,
    'SVDF': 27,
    'TANH': 28,
    'CONCATEMBEDDINGS': 29,
    'SKIPGRAM': 30,
    'CALL': 31,
    'CUSTOM': 32,
    'EMBEDDINGLOOKUPSPARSE': 33,
    'PAD': 34,
    'UNIDIRECTIONALSEQUENCERNN': 35,
    'GATHER': 36,
    'BATCHTOSPACEND': 37,
    'SPACETOBATCHND': 38,
    'TRANSPOSE': 39,
    'MEAN': 40,
    'SUB': 41,
    'DIV': 42,
    'SQUEEZE': 43,
    'UNIDIRECTIONALSEQUENCELSTM': 44,
    'STRIDEDSLICE': 45,
    'BIDIRECTIONALSEQUENCERNN': 46,
    'EXP': 47,
    'TOPKV2': 48,
    'SPLIT': 49,
    'LOGSOFTMAX': 50,
    'DELEGATE': 51,
    'BIDIRECTIONALSEQUENCELSTM': 52,
    'CAST': 53,
    'PRELU': 54,
    'MAXIMUM': 55,
    'ARGMAX': 56,
    'MINIMUM': 57,
    'LESS': 58,
    'NEG': 59,
    'PADV2': 60,
    'GREATER': 61,
    'GREATEREQUAL': 62,
    'LESSEQUAL': 63,
    'SELECT': 64,
    'SLICE': 65,
    'SIN': 66,
    'TRANSPOSECONV': 67,
    'SPARSETODENSE': 68,
    'TILE': 69,
    'EXPANDDIMS': 70,
    'EQUAL': 71,
    'NOTEQUAL': 72,
    'LOG': 73,
    'SUM': 74,
    'SQRT': 75,
    'RSQRT': 76,
    'SHAPE': 77,
    'POW': 78,
    'ARGMIN': 79,
    'FAKEQUANT': 80,
    'REDUCEPROD': 81,
    'REDUCEMAX': 82,
    'PACK': 83,
    'LOGICALOR': 84,
    'ONEHOT': 85,
    'LOGICALAND': 86,
    'LOGICALNOT': 87,
    'UNPACK': 88,
    'REDUCEMIN': 89,
    'FLOORDIV': 90,
    'REDUCEANY': 91,
    'SQUARE': 92,
    'ZEROSLIKE': 93,
    'FILL': 94,
    'FLOORMOD': 95,
    'RANGE': 96,
    'RESIZENEARESTNEIGHBOR': 97,
    'LEAKYRELU': 98,
    'SQUAREDDIFFERENCE': 99,
    'MIRRORPAD': 100,
    'ABS': 101,
    'SPLITV': 102,
    'UNIQUE': 103,
    'CEIL': 104,
    'REVERSEV2': 105,
    'ADDN': 106,
    'GATHERND': 107,
    'COS': 108,
    'WHERE': 109,
    'RANK': 110,
    'ELU': 111,
    'REVERSESEQUENCE': 112,
    'MATRIXDIAG': 113,
    'QUANTIZE': 114,
    'MATRIXSETDIAG': 115,
    'ROUND': 116,
    'HARDSWISH': 117,
    'IF': 118,
    'WHILE': 119,
    'NONMAXSUPPRESSIONV4': 120,
    'NONMAXSUPPRESSIONV5': 121,
    'SCATTERND': 122,
    'SELECTV2': 123,
    'DENSIFY': 124,
    'SEGMENTSUM': 125,
    'BATCHMATMUL': 126,
    'BCQGATHER': 252,
    'BCQFULLYCONNECTED': 253,
    'INSTANCENORM': 254
};
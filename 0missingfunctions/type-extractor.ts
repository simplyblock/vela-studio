import * as fs from "fs";
import * as path from "path";
import ts from "typescript";

const [,, inPath, outPath] = process.argv;
if (!inPath) {
  console.error("Usage: ts-node extract-schemas.ts <input.ts> [output.ts]");
  process.exit(1);
}

const sourceText = fs.readFileSync(inPath, "utf8");
const sourceFile = ts.createSourceFile(
  path.basename(inPath),
  sourceText,
  ts.ScriptTarget.Latest,
  /*setParentNodes*/ true,
  ts.ScriptKind.TS
);

function isNamed(name: string, node: ts.Node): boolean {
  const n = (node as any).name;
  return !!n && ts.isIdentifier(n) && n.text === name;
}

function getPropByName(typeLiteral: ts.TypeLiteralNode, propName: string): ts.PropertySignature | undefined {
  return typeLiteral.members.find(
    (m): m is ts.PropertySignature =>
      ts.isPropertySignature(m) &&
      ((ts.isIdentifier(m.name) && m.name.text === propName) ||
        (ts.isStringLiteral(m.name) && m.name.text === propName))
  );
}

function findComponentsSchemasLiteral(sf: ts.SourceFile): ts.TypeLiteralNode | undefined {
  let schemasLiteral: ts.TypeLiteralNode | undefined;

  function visit(node: ts.Node) {
    // components can be an interface or a type alias
    if (ts.isInterfaceDeclaration(node) && isNamed("components", node)) {
      const schemasProp = getPropByName(node.members as unknown as ts.TypeLiteralNode, "schemas");
      if (schemasProp?.type && ts.isTypeLiteralNode(schemasProp.type)) {
        schemasLiteral = schemasProp.type;
      }
    }
    if (ts.isTypeAliasDeclaration(node) && isNamed("components", node)) {
      if (ts.isTypeLiteralNode(node.type)) {
        const schemasProp = getPropByName(node.type, "schemas");
        if (schemasProp?.type && ts.isTypeLiteralNode(schemasProp.type)) {
          schemasLiteral = schemasProp.type;
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sf);
  return schemasLiteral;
}

const schemasLiteral = findComponentsSchemasLiteral(sourceFile);
if (!schemasLiteral) {
  console.error("Could not find `components.schemas` type literal in the input file.");
  process.exit(2);
}

const factory = ts.factory;
const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

const outStatements: ts.Statement[] = [];

// Add a header comment
outStatements.push(
  factory.createNotEmittedStatement(sourceFile) as unknown as ts.Statement
);
(ts.addSyntheticLeadingComment as any)(
  outStatements[0],
  ts.SyntaxKind.MultiLineCommentTrivia,
  " Auto-generated from components.schemas — DO NOT EDIT BY HAND ",
  true
);

// For each property under `schemas`, emit an interface or type alias
for (const member of schemasLiteral.members) {
  if (!ts.isPropertySignature(member)) continue;

  const nameNode = member.name;
  const schemaName =
    ts.isIdentifier(nameNode) ? nameNode.text :
      ts.isStringLiteral(nameNode) ? nameNode.text :
        undefined;

  if (!schemaName || !member.type) continue;

  const typeNode = member.type;

  if (ts.isTypeLiteralNode(typeNode)) {
    // Create: export interface <Name> { ...members... }
    const iface = factory.createInterfaceDeclaration(
      /*modifiers*/ [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
      /*name*/ schemaName,
      /*typeParameters*/ undefined,
      /*heritageClauses*/ undefined,
      /*members*/ typeNode.members.map(m => m)
    );

    // Preserve any comments on the original type node by attaching them to the new interface
    ts.setSyntheticLeadingComments(iface, ts.getSyntheticLeadingComments(typeNode) ?? ts.getLeadingCommentRanges(sourceText, typeNode.pos)?.map(r => ({
      kind: ts.SyntaxKind.MultiLineCommentTrivia,
      text: sourceText.slice(r.pos + 2, r.end - 2),
      hasTrailingNewLine: true,
      pos: -1,
      end: -1
    })) ?? []);

    outStatements.push(iface);
  } else {
    // Fallback: export type <Name> = <original type>;
    const typeAlias = factory.createTypeAliasDeclaration(
      /*modifiers*/ [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
      /*name*/ schemaName,
      /*typeParameters*/ undefined,
      /*type*/ typeNode
    );
    outStatements.push(typeAlias);
  }
}

const outSourceFile = ts.factory.createSourceFile(
  outStatements,
  ts.factory.createToken(ts.SyntaxKind.EndOfFileToken),
  ts.NodeFlags.None
);

// Ensure it's treated as a module (so `export` is valid) even if empty
(outSourceFile as any).fileName = outPath ? path.basename(outPath) : "extracted-schemas.ts";

const output = printer.printFile(outSourceFile);

if (outPath) {
  fs.writeFileSync(outPath, output, "utf8");
  console.log(`Wrote ${outPath}`);
} else {
  process.stdout.write(output);
}
import os, glob, re

files = glob.glob("src/components/shift/**/*.jsx", recursive=True) + \
        glob.glob("src/pages/*.jsx", recursive=True)

def remove_conflicts(class_str):
    if "liquid-card" not in class_str:
        return class_str
    
    # Remove rounded-*
    class_str = re.sub(r"\brounded-(sm|md|lg|xl|2xl|3xl|full|none)\b", "", class_str)
    
    # Remove borders
    class_str = re.sub(r"\bborder(-border(?:/\d+)?)?\b", "", class_str)
    
    # Remove shadows
    class_str = re.sub(r"\bshadow-(sm|md|lg|xl|2xl|inner|none)\b", "", class_str)
    
    # Clean up spaces
    class_str = re.sub(r"\s+", " ", class_str).strip()
    return class_str

for f in set(files):
    if not os.path.exists(f): continue
    
    with open(f, "r") as file:
        content = file.read()
    
    # Find className="...", className={'...'}, className={`...`}
    def replacer(match):
        quote = match.group(1)
        classes = match.group(2)
        new_classes = remove_conflicts(classes)
        return f"className={quote}{new_classes}{quote}"
        
    new_content = re.sub(r"className=([\"'\`])(.*?)\1", replacer, content)
    
    if new_content != content:
        with open(f, "w") as file:
            file.write(new_content)
        print(f"Updated {f}")
